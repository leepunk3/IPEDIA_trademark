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

type AutoReviewInfo = {
  ai_review_status?: string;
  ai_review_code?: string;
  ai_risk_level?: string;
  ai_score?: string | number;
  ai_reason?: string;
  ai_need_manual?: string;
  result_page_type?: "LOW_RISK" | "MEDIUM_RISK" | "HIGH_RISK" | "";
};

type ReviewInfo = {
  exists?: boolean;
  review_status?: string;
  send_ready?: string;
  mail_sent?: string;
  trademark_review?: string;
  design_review?: string;
  recommended_service?: string;
  quoted_fee?: string;
  review_message?: string;
  ai_review_status?: string;
  ai_review_code?: string;
  ai_risk_level?: string;
  ai_score?: string | number;
  ai_reason?: string;
  ai_need_manual?: string;
  result_page_type?: string;
  review_sent_at?: string;
};

type PaymentInfo = {
  exists?: boolean;
  payment_status?: string;
  payment_url?: string;
  amount?: string | number;
  payment_amount?: string | number;
  payer_name?: string;
  paid_at?: string;
  payment_confirmed?: string;
  confirmation_mail_sent?: string;
};

type ApplicantInfo = {
  applicant_type?: "개인" | "개인사업자" | "법인" | "";
  applicant_name?: string;
  applicant_name_eng?: string;
  applicant_resident_number?: string;
  representative_name?: string;
  address?: string;
  phone?: string;
  email?: string;
  applicant_code_status?: "있음" | "없음";
  applicant_code?: string;
  applicant_code_issue_request?: boolean;
  trademark_name?: string;
  goods_services?: string;
  class_codes?: string;
  character_name?: string;
  design_product_name?: string;
  seal_usage_agree?: boolean;
  seal_file_name?: string;
  seal_file_url?: string;
  poa_date_input?: string;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  data?: PageData;
  already_submitted?: boolean;
  payment?: PaymentInfo;
  review?: ReviewInfo;
  auto_review?: AutoReviewInfo;
  applicant?: ApplicantInfo;
  file_url?: string;
  file_id?: string;
  poa_exists?: boolean;
  poa_preview_url?: string;
  poa_confirmed?: boolean;
  missing_fields?: string[];
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
};

function getTokenFromUrl() {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  return params.get("token") || "";
}

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatText(value?: string | number | boolean | null) {
  return value === undefined || value === null || value === "" ? "-" : String(value);
}

function formatAmount(value?: string | number) {
  if (value === undefined || value === null || value === "") return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return `${num.toLocaleString("ko-KR")}원`;
}

function getStageLabel(stage?: string) {
  switch (stage) {
    case "LEAD_RECEIVED":
      return "접수 완료";
    case "AI_REVIEW_PENDING":
      return "AI 검토 진행 중";
    case "AI_REVIEW_DONE":
      return "AI 검토 완료";
    case "AWAITING_APPLICANT_INFO":
      return "출원 정보 입력 요청";
    case "APPLICANT_INFO_SUBMITTED":
      return "출원 정보 제출 완료";
    case "MANUAL_REVIEW_PENDING":
      return "재검토 진행 중";
    case "MANUAL_REVIEW_DONE":
      return "검토 결과 안내";
    case "PAYMENT_PENDING":
      return "결제 대기";
    case "PAYMENT_COMPLETED":
      return "결제 완료";
    case "SEAL_UPLOADED":
      return "인감 업로드 완료";
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

function getCurrentStepIndex(stage?: string) {
  switch (stage) {
    case "LEAD_RECEIVED":
      return 0;
    case "AI_REVIEW_PENDING":
    case "AI_REVIEW_DONE":
    case "AWAITING_APPLICANT_INFO":
    case "APPLICANT_INFO_SUBMITTED":
    case "MANUAL_REVIEW_PENDING":
      return 1;
    case "MANUAL_REVIEW_DONE":
      return 2;
    case "PAYMENT_PENDING":
    case "PAYMENT_COMPLETED":
      return 3;
    case "SEAL_UPLOADED":
      return 4;
    case "POA_GENERATED":
    case "POA_CONFIRMED":
    case "READY_FOR_FILING":
    case "FILED":
      return 5;
    default:
      return 0;
  }
}

function getResultPageType(
  autoReview?: AutoReviewInfo,
  review?: ReviewInfo | null
): "LOW_RISK" | "MEDIUM_RISK" | "HIGH_RISK" | "" {
  return (
    autoReview?.result_page_type ||
    (review?.result_page_type as "LOW_RISK" | "MEDIUM_RISK" | "HIGH_RISK" | "") ||
    ""
  );
}

function FieldRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | boolean | null;
}) {
  return (
    <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
      <span className="font-medium text-gray-900">{label}: </span>
      <span>{formatText(value)}</span>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-bold text-gray-900">{title}</h2>
      <div className="space-y-3 text-sm leading-7 text-gray-700">{children}</div>
    </section>
  );
}

function StepBar({ currentStage }: { currentStage?: string }) {
  const steps = [
    "채널명 접수",
    "출원정보 제출",
    "검토 결과 안내",
    "결제",
    "인감 업로드",
    "위임장",
  ];

  const currentIndex = getCurrentStepIndex(currentStage);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        {steps.map((step, idx) => {
          const active = idx <= currentIndex;
          return (
            <div
              key={step}
              className={classNames(
                "rounded-xl border px-3 py-3 text-center text-xs font-medium",
                active
                  ? "border-black bg-black text-white"
                  : "border-gray-200 bg-gray-50 text-gray-500"
              )}
            >
              <div className="mb-1 text-[11px] opacity-80">STEP {idx + 1}</div>
              <div>{step}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewHero({
  trademarkName,
  resultType,
  reason,
}: {
  trademarkName: string;
  resultType: "LOW_RISK" | "MEDIUM_RISK" | "HIGH_RISK" | "";
  reason?: string;
}) {
  const badgeMap = {
    LOW_RISK: "진행 가능성 양호",
    MEDIUM_RISK: "보완 검토 필요",
    HIGH_RISK: "거절 가능성 높음",
    "": "검토 진행 중",
  };

  const titleMap = {
    LOW_RISK: "현재 기준으로는 명백한 절대적 부등록 사유 가능성이 높지 않습니다.",
    MEDIUM_RISK: "현재 채널명은 일부 표현 보완 또는 재검토가 필요한 상태입니다.",
    HIGH_RISK: "현재 채널명은 그대로 출원할 경우 거절 가능성이 높은 상태입니다.",
    "": "현재 검토가 진행 중입니다.",
  };

  return (
    <div className="rounded-3xl bg-black px-6 py-8 text-white">
      <div className="mb-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-sm font-medium">
        AI 검토 결과: {badgeMap[resultType]}
      </div>
      <h2 className="mb-2 text-2xl font-bold">{trademarkName || "채널명 미입력"}</h2>
      <p className="mb-4 text-sm leading-7 text-gray-200">{titleMap[resultType]}</p>
      {reason && (
        <div className="rounded-2xl bg-white/10 p-4 text-sm leading-7 text-gray-100">
          {reason}
        </div>
      )}
    </div>
  );
}

function ReviewResultSection({
  trademarkName,
  autoReview,
  review,
}: {
  trademarkName: string;
  autoReview?: AutoReviewInfo;
  review?: ReviewInfo | null;
}) {
  const resultType = getResultPageType(autoReview, review || undefined);
  const reason = autoReview?.ai_reason || review?.review_message || review?.trademark_review || "";

  if (!resultType) {
    return (
      <section className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6 shadow-sm">
        <h2 className="mb-3 text-2xl font-bold text-yellow-900">AI 검토 진행 중</h2>
        <p className="text-yellow-900">채널명 기준 자동 검토가 진행 중입니다.</p>
      </section>
    );
  }

  if (resultType === "HIGH_RISK") {
    return (
      <div className="space-y-6">
        <ReviewHero trademarkName={trademarkName} resultType={resultType} reason={reason} />
        <SectionCard title="왜 문제가 되나요">
          <p>현재 채널명은 상품 또는 서비스의 성질, 용도, 특징을 직접 설명하는 표현으로 인식될 가능성이 있습니다.</p>
          <p>이 경우 소비자는 이를 브랜드보다는 일반 설명으로 받아들일 수 있어 등록이 제한될 수 있습니다.</p>
        </SectionCard>
        <SectionCard title="권장 진행 방식">
          <ul className="list-disc pl-5">
            <li>대체 상표안 검토 후 진행</li>
            <li>현재 상표명 기반 보완 검토</li>
            <li>지정상품 조정 검토</li>
          </ul>
        </SectionCard>
      </div>
    );
  }

  if (resultType === "MEDIUM_RISK") {
    return (
      <div className="space-y-6">
        <ReviewHero trademarkName={trademarkName} resultType={resultType} reason={reason} />
        <SectionCard title="왜 보완 검토가 필요한가요">
          <p>제출하신 채널명은 일부 표현이 브랜드 이름보다는 설명 문구처럼 인식될 가능성이 있습니다.</p>
          <p>다만 지정상품 설정, 표현 보완, 출원 방향 조정을 통해 충분히 진행 방향을 잡을 수 있습니다.</p>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ReviewHero trademarkName={trademarkName} resultType={resultType} reason={reason} />
      <SectionCard title="왜 지금 진행하는 것이 좋나요">
        <ul className="list-disc pl-5">
          <li>브랜드를 계속 사용할 계획이라면 권리 확보를 먼저 하는 것이 유리합니다.</li>
          <li>타인이 유사 명칭을 먼저 확보하기 전에 방향을 정할 수 있습니다.</li>
          <li>초기 단계에서 정리할수록 브랜딩 비용을 줄일 수 있습니다.</li>
        </ul>
      </SectionCard>
    </div>
  );
}

export default function ProgressPage() {
  const [token, setToken] = useState("");
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [review, setReview] = useState<ReviewInfo | null>(null);
  const [autoReview, setAutoReview] = useState<AutoReviewInfo | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [sealUploading, setSealUploading] = useState(false);
  const [poaLoading, setPoaLoading] = useState(false);
  const [poaConfirmLoading, setPoaConfirmLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");

  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [editingApplicant, setEditingApplicant] = useState(false);
  const [editingTrademark, setEditingTrademark] = useState(false);

  const [sealFile, setSealFile] = useState<File | null>(null);
  const [sealFileName, setSealFileName] = useState("");
  const [sealFileUrl, setSealFileUrl] = useState("");
  const [sealUsageAgree, setSealUsageAgree] = useState(false);

  const [poaDate, setPoaDate] = useState(formatDateInput(new Date()));
  const [poaPreviewUrl, setPoaPreviewUrl] = useState("");
  const [poaGenerated, setPoaGenerated] = useState(false);
  const [poaConfirmed, setPoaConfirmed] = useState(false);
  const [poaSealConfirm, setPoaSealConfirm] = useState(false);

  const [payerName, setPayerName] = useState("");

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
  });

  const loadPage = async (t: string) => {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
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
      const applicant = result.applicant || {};
      const reviewInfo = result.review || { exists: false };
      const autoReviewInfo = result.auto_review || {};

      setPageData(data);
      setPayment(paymentInfo);
      setReview(reviewInfo);
      setAutoReview(autoReviewInfo);
      setAlreadySubmitted(!!result.already_submitted);
      setPayerName(String(paymentInfo.payer_name || ""));

      setForm({
        applicant_type: (applicant.applicant_type as FormState["applicant_type"]) || "",
        applicant_name: applicant.applicant_name || "",
        applicant_name_eng: applicant.applicant_name_eng || "",
        applicant_resident_number: applicant.applicant_resident_number || "",
        representative_name: applicant.representative_name || "",
        address: applicant.address || "",
        phone: applicant.phone || "",
        email: applicant.email || data?.email || "",
        applicant_code_status:
          (applicant.applicant_code_status as FormState["applicant_code_status"]) || "없음",
        applicant_code: applicant.applicant_code || "",
        applicant_code_issue_request: !!applicant.applicant_code_issue_request,
        trademark_name: applicant.trademark_name || data?.channel_name || "",
        goods_services: applicant.goods_services || "",
        class_codes: applicant.class_codes || "",
        character_name: applicant.character_name || "",
        design_product_name: applicant.design_product_name || "",
      });

      setSealFileName(applicant.seal_file_name || "");
      setSealFileUrl(applicant.seal_file_url || "");
      setSealUsageAgree(!!applicant.seal_usage_agree);
      setPoaDate(applicant.poa_date_input || formatDateInput(new Date()));
      setPoaGenerated(!!result.poa_exists || !!result.poa_preview_url || !!result.file_url);
      setPoaConfirmed(!!result.poa_confirmed);
      setPoaPreviewUrl(result.poa_preview_url || result.file_url || "");

      if (result.already_submitted) {
        setEditingApplicant(false);
        setEditingTrademark(false);
      }
    } catch (error) {
      setErrorMessage("진행 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = getTokenFromUrl();
    setToken(t);

    if (!t) {
      setErrorMessage("유효하지 않은 접근입니다. 메일의 진행 링크를 다시 확인해 주세요.");
      setLoading(false);
      return;
    }

    void loadPage(t);
  }, []);

  const isRepresentativeVisible = useMemo(() => form.applicant_type === "법인", [form.applicant_type]);
  const isApplicantCodeInputVisible = useMemo(() => form.applicant_code_status === "있음", [form.applicant_code_status]);
  const isApplicantCodeRequestVisible = useMemo(() => form.applicant_code_status === "없음", [form.applicant_code_status]);

  const canShowApplicantEdit = !alreadySubmitted || editingApplicant;
  const canShowTrademarkEdit = !alreadySubmitted || editingTrademark;

  const reviewCompleted = !!review?.exists && String(review?.mail_sent || "").toUpperCase() === "Y";
  const canShowPaymentSection = reviewCompleted;
  const paymentCompleted = payment?.payment_status === "PAID";
  const paymentRequested = payment?.payment_status === "REQUESTED";
  const sealUploaded = !!sealFileName;

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

  const validateApplicant = () => {
    if (!form.applicant_type) return "출원인 유형을 선택해 주세요.";
    if (!form.applicant_name.trim()) return "출원인 국문 이름 또는 법인명을 입력해 주세요.";
    if (!form.applicant_resident_number.trim()) return "주민등록번호를 입력해 주세요.";
    if (!form.address.trim()) return "주소를 입력해 주세요.";
    if (!form.phone.trim()) return "전화번호를 입력해 주세요.";
    if (!form.email.trim()) return "이메일을 입력해 주세요.";
    return "";
  };

  const validateTrademark = () => {
    if (!form.goods_services.trim()) return "지정서비스명을 입력해 주세요.";
    if (form.applicant_code_status === "있음" && !form.applicant_code.trim()) {
      return "출원인 코드가 있다고 선택한 경우 출원인 코드를 입력해 주세요.";
    }
    if (form.applicant_code_status === "없음" && !form.applicant_code_issue_request) {
      return "출원인 코드가 없는 경우 신규 발급 요청에 체크해 주세요.";
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

    const applicantValidation = validateApplicant();
    if (applicantValidation) {
      setErrorMessage(applicantValidation);
      return;
    }

    const trademarkValidation = validateTrademark();
    if (trademarkValidation) {
      setErrorMessage(trademarkValidation);
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: alreadySubmitted ? "updateApplicantIntake" : "saveApplicantIntake",
          token,
          ...form,
        }),
      });

      const result: ApiResponse = await res.json();

      if (!result.success) {
        setErrorMessage(result.message || "저장에 실패했습니다.");
        return;
      }

      setSubmitMessage(
        result.message || (alreadySubmitted ? "수정 내용이 저장되었습니다." : "출원 정보가 제출되었습니다.")
      );
      setAlreadySubmitted(true);
      setEditingApplicant(false);
      setEditingTrademark(false);
      await loadPage(token);
    } catch (error) {
      setErrorMessage("저장 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmPayment = async () => {
    setPaymentLoading(true);
    setErrorMessage("");
    setSubmitMessage("");

    if (!payerName.trim()) {
      setErrorMessage("예금주명을 입력해 주세요.");
      setPaymentLoading(false);
      return;
    }

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
          payer_name: payerName.trim(),
        }),
      });

      const result: ApiResponse = await res.json();

      if (!result.success) {
        setErrorMessage(result.message || "결제 완료 처리에 실패했습니다.");
        return;
      }

      setSubmitMessage("입금 확인중입니다.");
      await loadPage(token);
    } catch (error) {
      setErrorMessage("결제 완료 처리 중 오류가 발생했습니다.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const uploadSeal = async () => {
    setSealUploading(true);
    setErrorMessage("");
    setSubmitMessage("");

    try {
      if (!sealFile) {
        setErrorMessage("인감 이미지를 선택해 주세요.");
        return;
      }

      const maxSize = 10 * 1024 * 1024;
      if (sealFile.size > maxSize) {
        setErrorMessage("인감도장 이미지 파일 크기는 10MB 이하만 업로드 가능합니다.");
        return;
      }

      if (!sealUsageAgree) {
        setErrorMessage("인감도장 동일 사용 동의에 체크해 주세요.");
        return;
      }

      const base64 = await fileToBase64(sealFile);

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "uploadSeal",
          token,
          seal_file_name: sealFile.name,
          seal_mime_type: sealFile.type || "application/octet-stream",
          seal_file_data: base64,
          seal_usage_agree: sealUsageAgree,
        }),
      });

      const result: ApiResponse = await res.json();

      if (!result.success) {
        setErrorMessage(result.message || "인감 업로드에 실패했습니다.");
        return;
      }

      setSubmitMessage(result.message || "인감도장 이미지가 업로드되었습니다.");
      await loadPage(token);
    } catch (error) {
      setErrorMessage("인감 업로드 중 오류가 발생했습니다.");
    } finally {
      setSealUploading(false);
    }
  };

  const generatePowerOfAttorney = async () => {
    setPoaLoading(true);
    setErrorMessage("");
    setSubmitMessage("");

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "generatePowerOfAttorney",
          token,
          poa_date: poaDate,
        }),
      });

      const result: ApiResponse = await res.json();

      if (!result.success) {
        setErrorMessage(result.message || "위임장 생성에 실패했습니다.");

        if (result.missing_fields?.includes("applicant_resident_number")) setEditingApplicant(true);
        if (result.missing_fields?.includes("applicant_code") || result.missing_fields?.includes("class_codes")) {
          setEditingTrademark(true);
        }
        return;
      }

      setSubmitMessage(result.message || "위임장이 생성되었습니다. 내용을 확인해 주세요.");
      await loadPage(token);
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
        headers: { "Content-Type": "text/plain;charset=utf-8" },
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

      setSubmitMessage(result.message || "위임장 확인이 완료되었습니다.");
      await loadPage(token);
    } catch (error) {
      setErrorMessage("위임장 확인 제출 중 오류가 발생했습니다.");
    } finally {
      setPoaConfirmLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-gray-700">진행 정보를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (errorMessage && !pageData) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 shadow-sm">
          <h1 className="mb-3 text-2xl font-bold text-red-700">진행 페이지 접근 오류</h1>
          <p className="text-red-700">{errorMessage}</p>
        </div>
      </div>
    );
  }

  const trademarkName = form.trademark_name || pageData?.channel_name || "";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">고객 전용 진행 페이지</h1>
        <p className="mb-5 text-gray-600">AI 검토 결과를 확인하고 출원인 정보와 상표 정보를 입력해 주세요.</p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-gray-50 p-4">
            <div className="text-sm text-gray-500">접수번호</div>
            <div className="mt-1 font-semibold text-gray-900">{pageData?.receipt_no || "-"}</div>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <div className="text-sm text-gray-500">현재 상태</div>
            <div className="mt-1 font-semibold text-gray-900">{getStageLabel(pageData?.current_stage)}</div>
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

      <div className="mb-6">
        <StepBar currentStage={pageData?.current_stage} />
      </div>

      <div className="mb-6">
        <ReviewResultSection trademarkName={pageData?.channel_name || ""} autoReview={autoReview || undefined} review={review} />
      </div>

      <form onSubmit={handleApplicantSubmit} className="space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">출원인 정보</h2>
            {alreadySubmitted && (
              <button
                type="button"
                onClick={() => setEditingApplicant((prev) => !prev)}
                className="text-sm font-medium text-blue-600 underline"
              >
                {editingApplicant ? "접기" : "수정하기"}
              </button>
            )}
          </div>

          {canShowApplicantEdit ? (
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
                <label className="mb-2 block text-sm font-medium text-gray-700">출원인 국문 이름 또는 법인명 *</label>
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
          ) : (
            <div className="grid gap-3">
              <FieldRow label="출원인 유형" value={form.applicant_type} />
              <FieldRow label="이름 또는 법인명" value={form.applicant_name} />
              <FieldRow label="영문명" value={form.applicant_name_eng} />
              <FieldRow label="주민등록번호" value={form.applicant_resident_number} />
              {form.applicant_type === "법인" && <FieldRow label="대표자명" value={form.representative_name} />}
              <FieldRow label="주소" value={form.address} />
              <FieldRow label="전화번호" value={form.phone} />
              <FieldRow label="이메일" value={form.email} />
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">출원인 코드 / 상표 정보</h2>
            {alreadySubmitted && (
              <button
                type="button"
                onClick={() => setEditingTrademark((prev) => !prev)}
                className="text-sm font-medium text-blue-600 underline"
              >
                {editingTrademark ? "접기" : "수정하기"}
              </button>
            )}
          </div>

          {canShowTrademarkEdit ? (
            <div className="grid gap-6">
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

              <div className="grid gap-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">상표명</label>
                  <input
                    name="trademark_name"
                    value={form.trademark_name}
                    onChange={updateField}
                    placeholder="실제 출원할 상표명을 입력해 주세요"
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

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">류 코드</label>
                  <input
                    name="class_codes"
                    value={form.class_codes}
                    onChange={updateField}
                    placeholder="예: 41"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                  />
                </div>

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
            </div>
          ) : (
            <div className="grid gap-3">
              <FieldRow label="출원인 코드 여부" value={form.applicant_code_status} />
              <FieldRow
                label="출원인 코드"
                value={
                  form.applicant_code_status === "있음"
                    ? form.applicant_code
                    : form.applicant_code_issue_request
                    ? "신규 발급 요청"
                    : "-"
                }
              />
              <FieldRow label="상표명" value={form.trademark_name} />
              <FieldRow label="지정서비스명" value={form.goods_services} />
              <FieldRow label="류 코드" value={form.class_codes} />
              <FieldRow label="캐릭터명" value={form.character_name} />
              <FieldRow label="물품명" value={form.design_product_name} />
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

        {(canShowApplicantEdit || canShowTrademarkEdit || !alreadySubmitted) && (
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-black px-6 py-4 text-base font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "저장 중..." : alreadySubmitted ? "수정 내용 저장하기" : "출원 정보 제출하기"}
          </button>
        )}
      </form>

      {alreadySubmitted && reviewCompleted && (
        <div className="mt-6 space-y-6">
          <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold text-blue-900">재검토 결과</h2>
            <div className="grid gap-3">
              <FieldRow label="상표 검토 의견" value={review?.trademark_review} />
              <FieldRow label="디자인 검토 의견" value={review?.design_review} />
              <FieldRow label="추천 진행 방식" value={review?.recommended_service} />
              <FieldRow label="예상 비용" value={review?.quoted_fee} />
              <FieldRow label="추가 안내" value={review?.review_message} />
              <FieldRow label="검토 전송일" value={review?.review_sent_at} />
            </div>
          </section>
        </div>
      )}

      {canShowPaymentSection && (
        <div className="mt-6 space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-2xl font-bold text-gray-900">결제 정보</h2>

            {paymentCompleted ? (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm leading-7 text-green-800">
                {formatAmount(payment?.amount ?? payment?.payment_amount ?? 0)} 입금이 확인되었습니다. 다음 단계 진행중입니다.
              </div>
            ) : paymentRequested ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
                입금 확인중입니다.
              </div>
            ) : (
              <p className="mb-6 text-gray-600">재검토 결과를 확인하셨다면 결제를 진행해 주세요.</p>
            )}

            <div className="mt-4 grid gap-4">
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-sm text-gray-500">결제 항목</div>
                <div className="mt-1 font-semibold text-gray-900">상표 출원 진행</div>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-sm text-gray-500">결제 금액</div>
                <div className="mt-1 font-semibold text-gray-900">
                  {formatAmount(payment?.amount ?? payment?.payment_amount ?? 330000)}
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-sm text-gray-500">결제 상태</div>
                <div className="mt-1 font-semibold text-gray-900">
                  {paymentCompleted ? "결제 완료" : paymentRequested ? "입금 확인중" : "결제 대기"}
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-sm text-gray-500">입금 계좌</div>
                <div className="mt-1 font-semibold text-gray-900">국민은행 693001-00-056923</div>
                <div className="mt-1 text-sm text-gray-700">예금주: 특허법인성암</div>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <label className="mb-2 block text-sm text-gray-500">고객 예금주명</label>
                <input
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  placeholder="입금자명을 입력해 주세요"
                  disabled={paymentCompleted || paymentRequested}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none disabled:bg-gray-100"
                />
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-sm text-gray-500">결제 완료 시각</div>
                <div className="mt-1 font-semibold text-gray-900">{formatText(payment?.paid_at)}</div>
              </div>
            </div>

            {!paymentCompleted && !paymentRequested && (
              <button
                type="button"
                onClick={confirmPayment}
                disabled={paymentLoading}
                className="mt-6 w-full rounded-2xl bg-black px-6 py-4 text-base font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {paymentLoading ? "처리 중..." : "입금완료했습니다"}
              </button>
            )}
          </section>
        </div>
      )}

      {paymentCompleted && (
        <div className="mt-6 space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-2xl font-bold text-gray-900">인감도장 이미지 업로드</h2>

            <div className="grid gap-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">인감도장 이미지 업로드 *</label>
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setSealFile(file);
                  }}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
                <p className="mt-2 text-sm text-gray-500">
                  위임장 및 출원인코드에 동일하게 사용할 인감도장 이미지를 업로드해 주세요.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">선택된 파일명</label>
                <input
                  value={sealFile ? sealFile.name : sealFileName}
                  readOnly
                  placeholder="선택된 인감도장 이미지 파일명이 표시됩니다"
                  className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 outline-none"
                />
              </div>

              <label className="flex items-start gap-3 rounded-xl bg-gray-50 px-4 py-4 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={sealUsageAgree}
                  onChange={(e) => setSealUsageAgree(e.target.checked)}
                  className="mt-1"
                />
                <span>업로드한 인감도장을 출원인코드 및 위임장 작성에 동일하게 사용하는 것에 동의합니다.</span>
              </label>

              {sealFileUrl && (
                <a
                  href={sealFileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-blue-600 underline"
                >
                  등록된 인감 이미지 보기
                </a>
              )}

              <button
                type="button"
                onClick={uploadSeal}
                disabled={sealUploading}
                className="w-full rounded-2xl bg-black px-6 py-4 text-base font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sealUploading ? "업로드 중..." : sealUploaded ? "인감 다시 업로드하기" : "인감 업로드하기"}
              </button>
            </div>
          </section>
        </div>
      )}

      {paymentCompleted && sealUploaded && (
        <div className="mt-6 space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-2xl font-bold text-gray-900">위임장 확인</h2>
            <p className="mb-6 text-gray-600">인감 업로드가 완료되었습니다. 위임일자를 확인한 뒤 위임장을 생성하고 내용을 확인해 주세요.</p>

            <div className="grid gap-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">위임일자 *</label>
                <input
                  type="date"
                  value={poaDate}
                  onChange={(e) => setPoaDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
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
                <iframe src={poaPreviewUrl} title="위임장 미리보기" className="h-[720px] w-full" />
              </div>

              <a
                href={poaPreviewUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-blue-600 underline"
              >
                새 창에서 위임장 보기
              </a>

              {!poaConfirmed && (
                <>
                  <div className="mt-5">
                    <label className="flex items-start gap-3 rounded-xl bg-gray-50 px-4 py-4 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={poaSealConfirm}
                        onChange={(e) => setPoaSealConfirm(e.target.checked)}
                        className="mt-1"
                      />
                      <span>본 위임장에 표시된 인감은 본인이 제출한 인감 이미지와 동일함을 확인합니다.</span>
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
                </>
              )}
            </section>
          )}
        </div>
      )}

      {poaConfirmed && (
        <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-8 shadow-sm">
          <h2 className="mb-3 text-2xl font-bold text-green-800">위임장 확인이 완료되었습니다</h2>
          <p className="text-green-800">검토, 결제, 인감 업로드, 위임장 확인이 정상적으로 완료되었습니다.</p>

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
