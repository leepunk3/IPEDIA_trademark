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

type UploadSummary = {
  totalCount: number;
  hasPowerOfAttorney: boolean;
};

type UploadItem = {
  created_at?: string;
  upload_type: string;
  file_name: string;
  file_url: string;
  upload_status: string;
};

type FormState = {
  applicant_type: "개인" | "개인사업자" | "법인" | "";
  applicant_name: string;
  applicant_name_eng: string;
  representative_name: string;
  address: string;
  phone: string;
  email: string;
  applicant_code_status: "있음" | "없음";
  applicant_code: string;
  applicant_code_issue_request: boolean;
  trademark_name: string;
  goods_services: string;
  character_name: string;
  design_product_name: string;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  data?: PageData;
  already_submitted?: boolean;
  payment?: PaymentInfo;
  upload_summary?: UploadSummary;
  uploads?: UploadItem[];
  file_url?: string;
  file_id?: string;
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
    case "WAITING_UPLOAD":
      return "자료 업로드 대기";
    case "READY_FOR_FILING":
      return "출원 준비 가능";
    case "FILED":
      return "출원 완료";
    default:
      return "진행 중";
  }
}

export default function ProgressPage() {
  const [token, setToken] = useState("");
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [uploadSummary, setUploadSummary] = useState<UploadSummary | null>(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");

  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [step, setStep] = useState<"form" | "payment" | "upload" | "done">("form");

  const [uploadType, setUploadType] = useState("POWER_OF_ATTORNEY");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");

  const [form, setForm] = useState<FormState>({
    applicant_type: "",
    applicant_name: "",
    applicant_name_eng: "",
    representative_name: "",
    address: "",
    phone: "",
    email: "",
    applicant_code_status: "없음",
    applicant_code: "",
    applicant_code_issue_request: false,
    trademark_name: "",
    goods_services: "",
    character_name: "",
    design_product_name: "",
    application_resident_number: "",
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
        const uploadInfo = result.upload_summary || {
          totalCount: 0,
          hasPowerOfAttorney: false,
        };

        setPageData(data);
        setPayment(paymentInfo);
        setUploadSummary(uploadInfo);
        setAlreadySubmitted(!!result.already_submitted);

        if (paymentInfo.exists && paymentInfo.payment_status === "PAID") {
          if (uploadInfo.hasPowerOfAttorney) {
            setStep("done");
          } else {
            setStep("upload");
          }
        } else if (result.already_submitted) {
          setStep("payment");
        } else {
          setStep("form");
        }

        setForm((prev) => ({
          ...prev,
          applicant_name: "",
          email: data?.email || "",
          trademark_name: "",
        }));
      } catch (error) {
        setErrorMessage("진행 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (step === "upload" && token) {
      void loadUploads();
    }
  }, [step, token]);

  const isRepresentativeVisible = useMemo(() => form.applicant_type === "법인", [form.applicant_type]);
  const isApplicantCodeInputVisible = useMemo(() => form.applicant_code_status === "있음", [form.applicant_code_status]);
  const isApplicantCodeRequestVisible = useMemo(() => form.applicant_code_status === "없음", [form.applicant_code_status]);

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
    if (!form.applicant_name.trim()) return "이름 또는 법인명을 입력해 주세요.";
    if (!form.address.trim()) return "주소를 입력해 주세요.";
    if (!form.phone.trim()) return "전화번호를 입력해 주세요.";
    if (!form.email.trim()) return "이메일을 입력해 주세요.";
    if (!form.trademark_name.trim()) return "상표명을 입력해 주세요.";
    if (!form.goods_services.trim()) return "지정상품명을 입력해 주세요.";
    if (form.applicant_code_status === "있음" && !form.applicant_code.trim()) {
      return "출원인 코드가 있다고 선택한 경우 출원인 코드를 입력해 주세요.";
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

    setSubmitting(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          action: "saveApplicantIntake",
          token,
          ...form,
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

      setStep("upload");
      setSubmitMessage("결제가 완료되었습니다. 이제 위임장/자료를 업로드해 주세요.");
    } catch (error) {
      setErrorMessage("결제 완료 처리 중 오류가 발생했습니다.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const loadUploads = async () => {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          action: "getUploadStatus",
          token,
        }),
      });

      const result: ApiResponse = await res.json();

      if (result.success) {
        setUploads(result.uploads || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSubmitMessage("");

    if (!selectedFile) {
      setErrorMessage("파일을 선택해 주세요.");
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setErrorMessage("파일 크기는 10MB 이하만 업로드 가능합니다.");
      return;
    }

    setUploadLoading(true);

    try {
      const base64 = await fileToBase64(selectedFile);

      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          action: "uploadFile",
          token,
          upload_type: uploadType,
          file_name: selectedFile.name,
          mime_type: selectedFile.type || "application/octet-stream",
          file_data: base64,
        }),
      });

      const result: ApiResponse = await res.json();

      if (!result.success) {
        setErrorMessage(result.message || "파일 업로드에 실패했습니다.");
        return;
      }

      setSubmitMessage(result.message || "파일이 정상적으로 업로드되었습니다.");
      setSelectedFile(null);
      setFileName("");

      const input = document.getElementById("real-file-upload") as HTMLInputElement | null;
      if (input) input.value = "";

      await loadUploads();

      if (uploadType === "POWER_OF_ATTORNEY") {
        setStep("done");
      }
    } catch (error) {
      setErrorMessage("파일 업로드 중 오류가 발생했습니다.");
    } finally {
      setUploadLoading(false);
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
                <label className="mb-2 block text-sm font-medium text-gray-700">이름 또는 법인명 *</label>
                <input
                  name="applicant_name"
                  value={form.applicant_name}
                  onChange={updateField}
                  placeholder="예: 홍길동 또는 ABC 주식회사"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">영문명 *</label>
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
                  value={form.applicant_resident_number || ""}
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
                    placeholder="출원인 코드를 입력해 주세요(모를 경우 공란)"
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
                  placeholder="채널과 실제 출원할 상표명이 다를 경우 출원하실 상표명을 알려주세요"
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

      {step === "upload" && (
        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-2xl font-bold text-gray-900">위임장 / 자료 업로드</h2>
            <p className="mb-6 text-gray-600">
              결제가 완료되었습니다. 출원 진행을 위해 자료를 업로드해 주세요(위임장은 필수 업로드).
            </p>

            <form onSubmit={handleUploadSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">자료 종류</label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                >
                  <option value="POWER_OF_ATTORNEY">위임장(필수)</option>
                  <option value="BUSINESS_CERTIFICATE">사업자등록증</option>
                  <option value="LOGO_FILE">브랜드 파일</option>
                  <option value="CHARACTER_IMAGE">캐릭터 파일(선택)</option>
                  <option value="OTHER">기타</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">파일 선택</label>
                <input
                  id="real-file-upload"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setSelectedFile(file);
                    setFileName(file ? file.name : "");
                  }}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
                <p className="mt-2 text-sm text-gray-500">
                  PDF, PNG, JPG, JPEG 파일 업로드 가능 / 10MB 이하 권장
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">선택된 파일명</label>
                <input
                  value={fileName}
                  readOnly
                  placeholder="선택된 파일이 표시됩니다"
                  className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={uploadLoading}
                className="w-full rounded-2xl bg-black px-6 py-4 text-base font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploadLoading ? "저장 중..." : "파일 업로드하기"}
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-xl font-bold text-gray-900">업로드된 자료</h3>

            {uploads.length === 0 ? (
              <p className="text-sm text-gray-600">아직 등록된 자료가 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {uploads.map((item, idx) => (
                  <div key={idx} className="rounded-xl bg-gray-50 p-4">
                    <div className="text-sm text-gray-500">{item.upload_type}</div>
                    <div className="mt-1 font-semibold text-gray-900">{item.file_name}</div>
                    <a
                      href={item.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block break-all text-sm text-blue-600 underline"
                    >
                      {item.file_url}
                    </a>
                  </div>
                ))}
              </div>
            )}
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
        </div>
      )}

      {step === "done" && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-8 shadow-sm">
          <h2 className="mb-3 text-2xl font-bold text-green-800">출원 준비 자료가 접수되었습니다</h2>
          <p className="text-green-800">
            위임장 및 자료가 정상적으로 등록되었습니다. 확인 후 출원 준비 단계로 진행됩니다.
          </p>
        </div>
      )}
    </div>
  );
}




