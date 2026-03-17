"use client";

import React, { useEffect, useMemo, useState } from "react";

const API_URL =
  "https://script.google.com/macros/s/AKfycbys_NnSDz8R6B4ceYdbScr2utmQ5KZBmXuyqmax7xAybOfcHfbqyRw8yCwbCX3JxW5a/exec";

type PageData = {
  lead_id: string;
  receipt_no: string;
  channel_name?: string;
  email?: string;
  current_stage?: string;
};

type PaymentInfo = {
  exists: boolean;
  payment_type?: string;
  payment_amount?: string;
  payment_status?: string;
  payment_method?: string;
  payment_reference?: string;
  paid_at?: string;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  data?: PageData;
  already_submitted?: boolean;
  payment?: PaymentInfo;
  file_url?: string;
  file_id?: string;
  poa_exists?: boolean;
  poa_preview_url?: string;
  poa_confirmed?: boolean;
};

type FormState = {
  applicant_type: "개인" | "개인사업자" | "법인" | "";
  applicant_name: string;
  applicant_name_eng: string;
  applicant_resident_number: string;
  representative_name: string;
  address: string;
  phone: string;
  email: string;
  applicant_code_status: "있음" | "없음";
  applicant_code: string;
  applicant_code_issue_request: boolean;
  trademark_name: string;
  goods_services: string;
  class_codes: string;
  character_name: string;
  design_product_name: string;
  seal_usage_agree: boolean;
};

function getTokenFromUrl() {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  return params.get("token") || "";
}

function getStageLabel(stage?: string) {
  switch (stage) {
    case "LEAD_RECEIVED":
      return "접수 완료";
    case "UNDER_REVIEW":
      return "검토 중";
    case "WAITING_APPLICANT_INFO":
      return "출원 정보 입력 요청";
    case "APPLICANT_INFO_SUBMITTED":
      return "출원 정보 제출 완료";
    case "PAYMENT_PENDING":
      return "결제 대기";
    case "PAYMENT_COMPLETED":
      return "결제 완료";
    case "POA_GENERATED":
      return "위임장 생성 완료";
    case "POA_CONFIRMED":
      return "위임장 확인 완료";
    case "READY_FOR_FILING":
      return "출원 준비 가능";
    case "FILED":
      return "출원 완료";
    default:
      return "진행 중";
  }
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function ProgressPage() {
  const [token, setToken] = useState("");
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [payment, setPayment] = useState<PaymentInfo | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [poaLoading, setPoaLoading] = useState(false);
  const [poaConfirmLoading, setPoaConfirmLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");

  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [step, setStep] = useState<"form" | "payment" | "poa" | "done">("form");

  const [sealFile, setSealFile] = useState<File | null>(null);
  const [sealFileName, setSealFileName] = useState("");

  const [poaDate, setPoaDate] = useState(formatDateInput(new Date()));
  const [poaPreviewUrl, setPoaPreviewUrl] = useState("");
  const [poaGenerated, setPoaGenerated] = useState(false);
  const [poaConfirmed, setPoaConfirmed] = useState(false);
  const [poaSealConfirm, setPoaSealConfirm] = useState(false);

  const [form, setForm] = useState<FormState>({
    applicant_type: "",
    applicant_name: "",
    applicant_name_eng: "",
    applicant_resident_number: "",
    representative_name: "",
    address: "",
    phone: "",
    email: "",
    applicant_code_status: "없음",
    applicant_code: "",
    applicant_code_issue_request: false,
    trademark_name: "",
    goods_services: "",
    class_codes: "",
    character_name: "",
    design_product_name: "",
    seal_usage_agree: false,
  });

  useEffect(() => {
    const t = getTokenFromUrl();
    setToken(t);

    if (!t) {
      setErrorMessage("유효하지 않은 접근입니다. 메일의 진행 링크를 다시 확인해 주세요.");
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain;charset=utf-8",
          },
          body: JSON.stringify({
            action: "getApplicantPageData",
            token: t,
          }),
        });

        const result: ApiResponse = await res.json();

        if (!result.success) {
          setErrorMessage(result.message || "진행 정보를 불러오지 못했습니다.");
          return;
        }

        const data = result.data || null;
        const paymentInfo = result.payment || { exists: false };

        setPageData(data);
        setPayment(paymentInfo);
        setAlreadySubmitted(!!result.already_submitted);

        if (paymentInfo.exists && paymentInfo.payment_status === "PAID") {
          if (result.poa_confirmed) {
            setStep("done");
            setPoaGenerated(true);
            setPoaConfirmed(true);
            setPoaPreviewUrl(result.poa_preview_url || result.file_url || "");
          } else {
            setStep("poa");
            setPoaGenerated(!!result.poa_exists || !!result.poa_preview_url || !!result.file_url);
            setPoaPreviewUrl(result.poa_preview_url || result.file_url || "");
          }
        } else if (result.already_submitted) {
          setStep("payment");
        } else {
          setStep("form");
        }

        setForm((prev) => ({
          ...prev,
          email: data?.email || "",
        }));
      } catch (error) {
        setErrorMessage("진행 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const isRepresentativeVisible = useMemo(
    () => form.applicant_type === "법인",
    [form.applicant_type]
  );
  const isApplicantCodeInputVisible = useMemo(
    () => form.applicant_code_status === "있음",
    [form.applicant_code_status]
  );
  const isApplicantCodeRequestVisible = useMemo(
    () => form.applicant_code_status === "없음",
    [form.applicant_code_status]
  );

  const updateField = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({
        ...prev,
        [name]: checked,
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validate = () => {
    if (!form.applicant_type) return "출원인 유형을 선택해 주세요.";
    if (!form.applicant_name.trim()) return "출원인 국문 이름 또는 법인명을 입력해 주세요.";
    if (!form.applicant_resident_number.trim()) return "주민등록번호를 입력해 주세요.";
    if (!form.address.trim()) return "주소를 입력해 주세요.";
    if (!form.phone.trim()) return "전화번호를 입력해 주세요.";
    if (!form.email.trim()) return "이메일을 입력해 주세요.";
    if (!form.goods_services.trim()) return "지정서비스명을 입력해 주세요.";
    if (!form.class_codes.trim()) return "상품류를 입력해 주세요.";
    if (form.applicant_code_status === "있음" && !form.applicant_code.trim()) {
      return "출원인 코드가 있다고 선택한 경우 출원인 코드를 입력해 주세요.";
    }
    if (form.applicant_code_status === "없음" && !form.applicant_code_issue_request) {
      return "출원인 코드가 없는 경우 신규 발급 요청에 체크해 주세요.";
    }
    if (!sealFile) return "인감도장 이미지를 업로드해 주세요.";
    if (!form.seal_usage_agree) {
      return "인감도장 동일 사용 동의에 체크해 주세요.";
    }
    return "";
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve(base64);
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleApplicantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSubmitMessage("");

    const validationMessage = validate();
    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    if (!sealFile) {
      setErrorMessage("인감도장 이미지를 업로드해 주세요.");
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (sealFile.size > maxSize) {
      setErrorMessage("인감도장 이미지 파일 크기는 10MB 이하만 업로드 가능합니다.");
      return;
    }

    setSubmitting(true);

    try {
      const sealBase64 = await fileToBase64(sealFile);

      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          action: "saveApplicantIntake",
          token,
          ...form,
          seal_file_name: sealFile.name,
          seal_mime_type: sealFile.type || "application/octet-stream",
          seal_file_data: sealBase64,
        }),
      });

      const result: ApiResponse = await res.json();

      if (!result.success) {
        setErrorMessage(result.message || "제출에 실패했습니다.");
        return;
      }

      setSubmitMessage(result.message || "입력이 정상적으로 접수되었습니다.");
      setAlreadySubmitted(true);

      await createPayment();
      setStep("payment");
    } catch (error) {
      setErrorMessage("제출 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const createPayment = async () => {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        action: "createPayment",
        token,
        payment_type: "TRADEMARK",
        amount: "330000",
      }),
    });

    const result: ApiResponse = await res.json();

    if (result.success) {
      setPayment({
        exists: true,
        payment_type: "TRADEMARK",
        payment_amount: "330000",
        payment_status: "PENDING",
      });
    }
  };

  const confirmPayment = async () => {
    setPaymentLoading(true);
    setErrorMessage("");
    setSubmitMessage("");

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          action: "confirmPayment",
          token,
          method: "bank_transfer",
          reference: "",
        }),
      });

      const result: ApiResponse = await res.json();

      if (!result.success) {
        setErrorMessage(result.message || "결제 완료 처리에 실패했습니다.");
        return;
      }

      setPayment((prev) => ({
        ...(prev || { exists: true }),
        payment_status: "PAID",
        payment_method: "bank_transfer",
      }));

      setStep("poa");
      setSubmitMessage(
        "결제가 완료되었습니다. 위임일자를 확인한 뒤 위임장을 생성해 주세요."
      );
    } catch (error) {
      setErrorMessage("결제 완료 처리 중 오류가 발생했습니다.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const generatePowerOfAttorney = async () => {
    setPoaLoading(true);
    setErrorMessage("");
    setSubmitMessage("");

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          action: "generatePowerOfAttorney",
          token,
          poa_date: poaDate,
        }),
      });

      const result: ApiResponse = await res.json();

      if (!result.success) {
        setErrorMessage(result.message || "위임장 생성에 실패했습니다.");
        return;
      }

      setPoaGenerated(true);
      setPoaPreviewUrl(result.poa_preview_url || result.file_url || "");
      setSubmitMessage(result.message || "위임장이 생성되었습니다. 내용을 확인해 주세요.");
    } catch (error) {
      setErrorMessage("위임장 생성 중 오류가 발생했습니다.");
    } finally {
      setPoaLoading(false);
    }
  };

  const confirmPowerOfAttorney = async () => {
    setPoaConfirmLoading(true);
    setErrorMessage("");
    setSubmitMessage("");

    if (!poaGenerated || !poaPreviewUrl) {
      setErrorMessage("먼저 위임장을 생성해 주세요.");
      setPoaConfirmLoading(false);
      return;
    }

    if (!poaSealConfirm) {
      setErrorMessage("위임장 인감 확인에 체크해 주세요.");
      setPoaConfirmLoading(false);
      return;
    }

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          action: "confirmPowerOfAttorney",
          token,
          poa_date: poaDate,
          poa_confirmed: true,
        }),
      });

      const result: ApiResponse = await res.json();

      if (!result.success) {
        setErrorMessage(result.message || "위임장 확인 제출에 실패했습니다.");
        return;
      }

      setPoaConfirmed(true);
      setStep("done");
      setSubmitMessage(result.message || "위임장 확인이 완료되었습니다.");
    } catch (error) {
      setErrorMessage("위임장 확인 제출 중 오류가 발생했습니다.");
    } finally {
      setPoaConfirmLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-gray-700">진행 정보를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (errorMessage && !pageData) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 shadow-sm">
          <h1 className="mb-3 text-2xl font-bold text-red-700">진행 페이지 접근 오류</h1>
          <p className="text-red-700">{errorMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">고객 전용 진행 페이지</h1>
        <p className="mb-5 text-gray-600">
          출원 진행을 위해 필요한 정보를 입력하고 결제를 진행해 주세요.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-gray-50 p-4">
            <div className="text-sm text-gray-500">접수번호</div>
            <div className="mt-1 font-semibold text-gray-900">{pageData?.receipt_no || "-"}</div>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <div className="text-sm text-gray-500">현재 상태</div>
            <div className="mt-1 font-semibold text-gray-900">
              {getStageLabel(pageData?.current_stage)}
            </div>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <div className="text-sm text-gray-500">채널명</div>
            <div className="mt-1 font-semibold text-gray-900">{pageData?.channel_name || "-"}</div>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <div className="text-sm text-gray-500">이메일</div>
            <div className="mt-1 font-semibold text-gray-900">{pageData?.email || "-"}</div>
          </div>
        </div>
      </div>

      {step === "form" && (
        <form onSubmit={handleApplicantSubmit} className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-bold text-gray-900">출원인 정보</h2>

            <div className="grid gap-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">출원인 유형 *</label>
                <select
                  name="applicant_type"
                  value={form.applicant_type}
                  onChange={updateField}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                >
                  <option value="">선택해 주세요</option>
                  <option value="개인">개인</option>
                  <option value="개인사업자">개인사업자</option>
                  <option value="법인">법인</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  출원인 국문 이름 또는 법인명 *
                </label>
                <input
                  name="applicant_name"
                  value={form.applicant_name}
                  onChange={updateField}
                  placeholder="예: 홍길동 또는 ABC 주식회사"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">영문명</label>
                <input
                  name="applicant_name_eng"
                  value={form.applicant_name_eng}
                  onChange={updateField}
                  placeholder="Hong Gil Dong / ABC Inc."
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">주민등록번호 *</label>
                <input
                  name="applicant_resident_number"
                  value={form.applicant_resident_number}
                  onChange={updateField}
                  placeholder="전체 기재"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </div>

              {isRepresentativeVisible && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">대표자명</label>
                  <input
                    name="representative_name"
                    value={form.representative_name}
                    onChange={updateField}
                    placeholder="대표자명을 입력해 주세요"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">주소 *</label>
                <input
                  name="address"
                  value={form.address}
                  onChange={updateField}
                  placeholder="주소를 입력해 주세요"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">전화번호 *</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={updateField}
                    placeholder="010-1234-5678"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">이메일 *</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={updateField}
                    placeholder="example@email.com"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-bold text-gray-900">출원인 코드</h2>

            <div className="grid gap-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">출원인 코드 여부</label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="applicant_code_status"
                      value="있음"
                      checked={form.applicant_code_status === "있음"}
                      onChange={updateField}
                    />
                    있음
                  </label>

                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="applicant_code_status"
                      value="없음"
                      checked={form.applicant_code_status === "없음"}
                      onChange={updateField}
                    />
                    없음
                  </label>
                </div>
              </div>

              {isApplicantCodeInputVisible && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">출원인 코드</label>
                  <input
                    name="applicant_code"
                    value={form.applicant_code}
                    onChange={updateField}
                    placeholder="출원인 코드를 입력해 주세요"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                  />
                </div>
              )}

              {isApplicantCodeRequestVisible && (
                <label className="flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    name="applicant_code_issue_request"
                    checked={form.applicant_code_issue_request}
                    onChange={updateField}
                  />
                  출원인 코드 신규 발급 요청
                </label>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-bold text-gray-900">상표 정보</h2>

            <div className="grid gap-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">상표명(선택)</label>
                <input
                  name="trademark_name"
                  value={form.trademark_name}
                  onChange={updateField}
                  placeholder="채널과 실제 출원할 상표명이 다를 경우 입력해 주세요"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">상품류 *</label>
                <input
                  name="class_codes"
                  value={form.class_codes}
                  onChange={updateField}
                  placeholder="예: 제35류 또는 제9류, 제35류"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">지정서비스명 *</label>
                <textarea
                  name="goods_services"
                  value={form.goods_services}
                  onChange={updateField}
                  placeholder="예: 온라인 교육 서비스, 유튜브 콘텐츠 제작업"
                  className="min-h-[120px] w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-bold text-gray-900">디자인 정보</h2>

            <div className="grid gap-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">캐릭터명</label>
                <input
                  name="character_name"
                  value={form.character_name}
                  onChange={updateField}
                  placeholder="캐릭터가 있을 경우 입력해 주세요"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">물품명</label>
                <input
                  name="design_product_name"
                  value={form.design_product_name}
                  onChange={updateField}
                  placeholder="예: 캐릭터 인형, 키링, 의류"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-bold text-gray-900">인감도장 이미지</h2>

            <div className="grid gap-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  인감도장 이미지 업로드 *
                </label>
                <input
                  id="seal-file-upload"
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setSealFile(file);
                    setSealFileName(file ? file.name : "");
                  }}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
                <p className="mt-2 text-sm text-gray-500">
                  출원인코드 등록 및 위임장 작성에 동일하게 사용할 인감도장 이미지를 업로드해
                  주세요. PNG 파일을 권장합니다.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">선택된 파일명</label>
                <input
                  value={sealFileName}
                  readOnly
                  placeholder="선택된 인감도장 이미지 파일명이 표시됩니다"
                  className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 outline-none"
                />
              </div>

              <label className="flex items-start gap-3 rounded-xl bg-gray-50 px-4 py-4 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="seal_usage_agree"
                  checked={form.seal_usage_agree}
                  onChange={updateField}
                  className="mt-1"
                />
                <span>
                  업로드한 인감도장을 출원인코드 및 위임장 작성에 동일하게 사용하는 것에
                  동의합니다.
                </span>
              </label>
            </div>
          </section>

          {errorMessage && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {submitMessage && !errorMessage && (
            <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {submitMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-black px-6 py-4 text-base font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "제출 중..." : "출원 정보 제출하기"}
          </button>
        </form>
      )}

      {step === "payment" && (
        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-2xl font-bold text-gray-900">결제 안내</h2>
            <p className="mb-6 text-gray-600">출원 진행을 위해 결제를 진행해 주세요.</p>

            <div className="grid gap-4">
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-sm text-gray-500">결제 항목</div>
                <div className="mt-1 font-semibold text-gray-900">상표 출원 진행</div>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-sm text-gray-500">결제 금액</div>
                <div className="mt-1 font-semibold text-gray-900">
                  {payment?.payment_amount
                    ? `${Number(payment.payment_amount).toLocaleString()}원`
                    : "330,000원"}
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-sm text-gray-500">입금 계좌</div>
                <div className="mt-1 font-semibold text-gray-900">국민은행 693001-00-056923</div>
                <div className="mt-1 text-sm text-gray-700">예금주: 특허법인성암</div>
              </div>
            </div>
          </section>

          {errorMessage && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {submitMessage && !errorMessage && (
            <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {submitMessage}
            </div>
          )}

          <button
            type="button"
            onClick={confirmPayment}
            disabled={paymentLoading}
            className="w-full rounded-2xl bg-black px-6 py-4 text-base font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {paymentLoading ? "처리 중..." : "입금 완료했습니다"}
          </button>
        </div>
      )}

      {step === "poa" && (
        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-2xl font-bold text-gray-900">위임장 확인</h2>
            <p className="mb-6 text-gray-600">
              결제가 완료되었습니다. 위임일자를 확인한 뒤 위임장을 생성하고 내용을 확인해
              주세요.
            </p>

            <div className="grid gap-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">위임일자 *</label>
                <input
                  type="date"
                  value={poaDate}
                  onChange={(e) => setPoaDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
                <p className="mt-2 text-sm text-gray-500">
                  위임장에 기재될 날짜입니다. 기본값은 오늘 날짜입니다.
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
                복사된 위임장에는 상품류, 출원인 국문 이름, 주민등록번호, 출원인코드(특허고객번호),
                동일 인감도장 이미지, 위임일자가 반영됩니다.
              </div>

              <button
                type="button"
                onClick={generatePowerOfAttorney}
                disabled={poaLoading}
                className="w-full rounded-2xl bg-black px-6 py-4 text-base font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {poaLoading ? "위임장 생성 중..." : poaGenerated ? "위임장 다시 생성하기" : "위임장 생성하기"}
              </button>
            </div>
          </section>

          {poaPreviewUrl && (
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xl font-bold text-gray-900">위임장 미리보기</h3>

              <div className="mb-4 overflow-hidden rounded-xl border border-gray-200">
                <iframe
                  src={poaPreviewUrl}
                  title="위임장 미리보기"
                  className="h-[720px] w-full"
                />
              </div>

              <a
                href={poaPreviewUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-blue-600 underline"
              >
                새 창에서 위임장 보기
              </a>

              <div className="mt-5">
                <label className="flex items-start gap-3 rounded-xl bg-gray-50 px-4 py-4 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={poaSealConfirm}
                    onChange={(e) => setPoaSealConfirm(e.target.checked)}
                    className="mt-1"
                  />
                  <span>
                    본 위임장에 표시된 인감은 본인이 제출한 인감 이미지와 동일함을 확인합니다.
                  </span>
                </label>
              </div>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={confirmPowerOfAttorney}
                  disabled={poaConfirmLoading || !poaGenerated}
                  className="w-full rounded-2xl bg-black px-6 py-4 text-base font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {poaConfirmLoading ? "제출 중..." : "위임장 확인 및 제출"}
                </button>
              </div>
            </section>
          )}

          {errorMessage && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {submitMessage && !errorMessage && (
            <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {submitMessage}
            </div>
          )}
        </div>
      )}

      {step === "done" && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-8 shadow-sm">
          <h2 className="mb-3 text-2xl font-bold text-green-800">위임장 확인이 완료되었습니다</h2>
          <p className="text-green-800">
            결제와 위임장 확인이 정상적으로 완료되었습니다. 확인 후 출원 준비 단계로
            진행됩니다.
          </p>

          {poaPreviewUrl && (
            <a
              href={poaPreviewUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block text-sm font-medium text-green-900 underline"
            >
              제출한 위임장 다시 보기
            </a>
          )}
        </div>
      )}
    </div>
  );
}
