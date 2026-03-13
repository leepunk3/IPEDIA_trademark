import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Shield,
  Copyright, 
  PenTool, 
  TrendingUp, 
  Youtube, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  MessageSquare,
  Package,
  Clock,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';

// Import local images
import psdkMain from '../assets/images/피식대학_대표.png';
import ccmMain from '../assets/images/침착맨_대표.png';
import isidolMain from '../assets/images/이셰게 아이돌_대표.png';
import negowangMain from '../assets/images/네고왕_대표.png';

export default function LandingPage() {

    const [channelInput, setChannelInput] = useState("")
  const [interestType, setInterestType] = useState("")
  const [email, setEmail] = useState("")
  const [privacyAgree, setPrivacyAgree] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbys_NnSDz8R6B4ceYdbScr2utmQ5KZBmXuyqmax7xAybOfcHfbqyRw8yCwbCX3JxW5a/exec"

  const handleSubmit = async (e) => {

    e.preventDefault()

    const payload = {
      channel_input: channelInput,
      interest_type: interestType,
      email: email,
      privacy_agree: "Y"
    }

    try {

      setIsSubmitting(true)

      const response = await fetch(APPS_SCRIPT_URL,{
        method:"POST",
        headers:{
          "Content-Type":"text/plain;charset=utf-8"
        },
        body:JSON.stringify(payload)
      })

      const result = await response.json()

      if(result.result==="success"){
        setSuccessMessage("신청이 접수되었습니다. 이메일을 확인해주세요.")
        setChannelInput("")
        setInterestType("")
        setEmail("")
        setPrivacyAgree(false)
      }else{
        setErrorMessage("전송 오류")
      }

    }catch(err){
      setErrorMessage("전송 중 오류가 발생했습니다.")
    }

    setIsSubmitting(false)

  }

  return (
    <div className="min-h-screen flex flex-col w-full bg-white font-sans text-secondary">
      {/* Hero Section */}
      <section className="pt-6 md:pt-10 pb-6 md:pb-10 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="bg-primary text-white rounded-[2rem] md:rounded-[4rem] p-8 md:p-16 shadow-2xl text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-white opacity-5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 md:w-80 md:h-80 bg-accent opacity-10 rounded-full -ml-24 -mb-24 blur-3xl"></div>
            
            <div className="relative z-10">
              <p className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-black mb-6 md:mb-10 leading-tight tracking-tighter">
                유튜브 채널이 성장하면<br/>
                <span className="text-accent">브랜드</span>가 됩니다.
              </p>
              <p className="text-2xl sm:text-3xl md:text-6xl lg:text-7xl font-black leading-tight tracking-tighter mb-8 md:mb-12">
                소중하게 키운 내 채널,<br/>
                <span className="text-accent">상표</span>와 <span className="text-accent">디자인</span>으로 보호하세요.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* Section 1.0 */}
      <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8 bg-white border-t border-border-light">
        <div className="max-w-7xl mx-auto">
          <div className="mb-0">
            {/* Subtitle 1 */}
            <div className="bg-bg-light p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-border-light shadow-sm">
              <h3 className="text-xl sm:text-2xl md:text-4xl font-black text-primary mb-6 md:mb-8 tracking-tighter text-center md:text-left">
                채널이 성장하면<br className="md:hidden"/> 다음과 같은 일이 생깁니다.
              </h3>
              <div className="grid md:grid-cols-3 gap-4 md:gap-10">
                {[
                  { title: "구독자 유입", desc: "채널명 검색 유입이 늘어납니다.", examples: "구래, 계향쓰, 푸디마마, 청담언니.." },
                  { title: "캐릭터 인지도", desc: "캐릭터가 유명해집니다.", examples: "쿠숭이, 초코캣, 노숭이..." },
                  { title: "브랜드 협업", desc: "협업 제안이 들어옵니다.", examples: "IT 채널 → 노트북 브랜드 협업, 캐릭터 채널 → 완구 브랜드 협업.." }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col gap-2 md:gap-4 p-5 md:p-6 bg-white rounded-2xl border border-border-light/50 hover:border-primary/20 transition-all">
                    <span className="text-[10px] md:text-xs font-black text-accent uppercase tracking-widest">POINT {i + 1}</span>
                    <span className="font-bold text-primary text-lg md:text-2xl leading-tight">{item.desc}</span>
                    <span className="text-secondary/60 text-sm md:text-lg font-medium">{item.examples}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2.0 - Negative Growth & Check */}
      <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8 bg-bg-light border-t border-border-light">
        <div className="max-w-7xl mx-auto">
          <div className="mb-0">
            {/* Subtitle 2 */}
            <div className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-border-light shadow-sm">
              <h3 className="text-xl sm:text-2xl md:text-4xl font-black text-primary mb-6 md:mb-8 tracking-tighter text-center md:text-left">
                하지만, 동시에 이런 일도 생깁니다.
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-10">
                {[
                  { title: "유사 채널이 검색 유입을 가져갑니다.", examples: "충주맨 개설자의 사칭 계정이 등장한 케이스" },
                  { title: "영상 제목이 카피됩니다.", examples: "유튜브 채널 ‘요즘 것들의 사생활’ 방송 이후 ‘요즘 것들이 수상해’가 TV 방영된 케이스" },
                  { title: "캐릭터 소유권 분쟁이 발생합니다.", examples: "캐릭터 디자인 회사와 애니메이션 제작사 중 누가 캐릭터 IP를 갖는가" },
                  { title: "소속사와 소유권 갈등이 생깁니다.", examples: "크리에이터가 회사와 갈라지면서 채널 이름을 바꾸는 경우" }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col gap-2 md:gap-4 p-5 md:p-6 bg-bg-light rounded-2xl border border-border-light/50 hover:border-primary/20 transition-all">
                    <span className="text-[10px] md:text-xs font-black text-accent uppercase tracking-widest">CASE {i + 1}</span>
                    <span className="font-bold text-primary text-lg md:text-2xl leading-tight">{item.title}</span>
                    <span className="text-secondary/60 text-sm md:text-lg font-medium">{item.examples}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Section 4 */}
      <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8 bg-white border-t border-border-light">
        <div className="max-w-7xl mx-auto">
          {/* Separate Check Section - Moved here */}
          <div className="max-w-4xl mx-auto mb-8 md:mb-12">
            <div className="bg-primary p-6 md:p-10 rounded-[1.5rem] md:rounded-[3rem] shadow-xl text-center flex flex-col justify-center items-center text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/10 rounded-full -ml-24 -mb-24 blur-3xl"></div>
              <p className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-black mb-6 md:mb-10 tracking-tighter leading-tight relative z-10">
                채널은 <span className="text-accent">재산권</span>으로 등록해야<br/> 소유권이 생깁니다.
              </p>
              <p className="text-base sm:text-lg md:text-2xl lg:text-3xl font-medium text-gray-300 leading-relaxed relative z-10 max-w-2xl">
                그래서 많은 크리에이터들이<br/>
                자신의 채널을 재산권으로 보호하고 있습니다.
              </p>
            </div>
          </div>

          {/* Trademark Case Studies */}
          <div className="mb-12 md:mb-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
              {[
                { name: "피식대학", desc: "채널 브랜드 등록\n40-1942440", mainImg: psdkMain },
                { name: "침착맨", desc: "활동명 상표 등록\n40-1711405 외 다수", mainImg: ccmMain },
                { name: "이세계 아이돌", desc: "프로젝트명 상표 등록\n40-2418828 외 다수", mainImg: isidolMain },
                { name: "네고왕", desc: "콘텐츠 제목 상표 등록\n40-1819112 외 다수", mainImg: negowangMain }
              ].map((item, i) => (
                <div key={i} className="group flex flex-col items-center text-center bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-border-light shadow-sm hover:shadow-md transition-all">
                  <div className="w-20 h-20 md:w-32 md:h-32 bg-bg-light rounded-full overflow-hidden mb-4 md:mb-6 border border-border-light flex items-center justify-center p-3 md:p-4">
                    <img 
                      src={item.mainImg} 
                      alt={`${item.name} 대표`}
                      className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h5 className="text-2xl md:text-3xl font-black text-primary mb-3 tracking-tighter">{item.name}</h5>
                  <p className="text-secondary/60 font-medium text-base md:text-lg leading-relaxed whitespace-pre-line">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16 md:mt-24 mb-10 md:mb-16 text-left">
            <h3 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-black text-primary leading-tight tracking-tighter">
              유튜브 채널을 보호하는 재산권에는<br className="hidden md:block"/> <span className="text-accent">무엇이 있을까요?</span>
            </h3>
            <p className="text-base sm:text-lg md:text-2xl text-secondary/60 mt-3 font-medium">
              유튜브 채널은 아래 두 축으로 보호해야 합니다.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-10">
            <div className="bg-white border border-border-light p-6 md:p-10 shadow-sm rounded-[1.5rem] md:rounded-[2rem] hover:shadow-xl transition-all">
              <h4 className="text-2xl md:text-4xl font-black text-primary mb-4 md:mb-6 flex items-center gap-3 md:gap-4">
                <span className="text-accent">01</span> 상표
              </h4>
              <ul className="space-y-3 md:space-y-4 mb-6">
                {["채널 이름/채널 로고", "크리에이터 활동명", "캐릭터 이름", "반복되는 콘텐츠 제목"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 md:gap-4 text-base sm:text-lg md:text-2xl text-secondary font-bold">
                    <CheckCircle2 className="w-5 h-5 md:w-8 md:h-8 text-accent shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="font-bold text-accent text-sm md:text-lg bg-accent/5 p-4 rounded-2xl border border-accent/10">상표는 이름, 로고, 표장을 보호하는 권리입니다.</p>
            </div>

            <div className="bg-white border border-border-light p-6 md:p-10 shadow-sm rounded-[1.5rem] md:rounded-[2rem] hover:shadow-xl transition-all">
              <h4 className="text-2xl md:text-4xl font-black text-primary mb-4 md:mb-6 flex items-center gap-3 md:gap-4">
                <span className="text-accent">02</span> 디자인
              </h4>
              <ul className="space-y-3 md:space-y-4 mb-6">
                {["캐릭터 외형", "굿즈 대표 이미지", "고유한 썸네일 디자인 구조", "버추얼 캐릭터의 아바타 디자인"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 md:gap-4 text-base sm:text-lg md:text-2xl text-secondary font-bold">
                    <CheckCircle2 className="w-5 h-5 md:w-8 md:h-8 text-accent shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="font-bold text-accent text-sm md:text-lg bg-accent/5 p-4 rounded-2xl border border-accent/10">디자인은 보이는 물품의 외형을 보호하는 권리입니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 */}
      <section className="pt-4 md:pt-6 pb-8 md:pb-12 px-4 sm:px-6 lg:px-8 bg-bg-light border-t border-border-light">
        <div className="max-w-7xl mx-auto">
          <div className="mt-4 md:mt-6 mb-8 md:mb-12">
            <div className="bg-white border border-border-light p-6 md:p-12 max-w-5xl mx-auto shadow-2xl rounded-[1.5rem] md:rounded-[3rem] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-accent"></div>
              <h3 className="text-lg sm:text-xl md:text-3xl lg:text-4xl font-black text-primary leading-tight tracking-tighter mb-6 md:mb-10 text-left">
                누가 먼저 등록해버리면<br/> 어떤 일이 생길까요?
              </h3>
              <div className="text-sm sm:text-base md:text-xl lg:text-2xl text-secondary/70 font-medium leading-relaxed space-y-3 md:space-y-5">
                <p>"내가 먼저 채널을 만들었으니까 당연히 내 거 아닌가요?"</p>
                <p>"내가 먼저 캐릭터를 공개했으니까 내 거 아닌가요?"</p>
                <div className="pt-4 md:pt-8">
                  <p className="text-primary font-bold">상표권과 디자인권은 누가 먼저 만들었는지보다</p>
                  <p className="mt-2 md:mt-4">
                    <strong className="text-primary text-base sm:text-lg md:text-2xl lg:text-3xl font-black border-b-2 md:border-b-4 border-accent/30 pb-1 inline-block">누가 먼저 재산권을 신청했는지</strong>가 중요합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 md:mt-24 w-full">
            <h4 className="text-xl sm:text-2xl md:text-5xl font-black text-primary mb-6 md:mb-10 text-center tracking-tighter">브랜드를 빼앗겼을때 생기는 <span className="text-accent">리스크</span></h4>
            <div className="grid md:grid-cols-2 gap-4 md:gap-8 max-w-6xl mx-auto">
              {[
                {
                  title: "1) 굿즈 출시가 어려워집니다",
                  desc: "캐릭터 이름으로 스티커, 인형, 문구, 의류를 판매하려는 순간 상표 문제가 드러날 수 있습니다."
                },
                {
                  title: "2) 브랜드 확장이 어려워집니다",
                  desc: "출판, 교육 콘텐츠, 협업 상품, 라이선스 사업을 하려 할 때 이름 사용이 불편해질 수 있습니다."
                },
                {
                  title: "3) 채널 운영과 별개로 사업이 꼬일 수 있습니다",
                  desc: "영상 업로드 자체와 상품 판매, 브랜드 운영은 별개로 검토될 수 있기 때문에 정작 돈이 되는 단계에서 문제가 발생할 수 있습니다."
                },
                {
                  title: "4) 이름을 바꿔야 될 수도 있습니다",
                  desc: "이미 쌓인 브랜드 인지도를 포기하거나 불필요한 법률 비용과 시간을 쓰게 될 수 있습니다."
                }
              ].map((risk, idx) => (
                <div key={idx} className="bg-white p-6 md:p-12 border border-border-light flex flex-col gap-3 md:gap-4 rounded-[1.2rem] md:rounded-[1.5rem] shadow-sm hover:shadow-md transition-all">
                  <h5 className="font-black text-primary text-lg md:text-2xl">{risk.title}</h5>
                  <p className="text-base md:text-2xl text-secondary/60 leading-relaxed font-medium">{risk.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 6 & CTA - Moved here */}
      <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8 bg-bg-light border-t border-border-light">
        <div className="max-w-5xl mx-auto text-center mb-8 md:mb-12">
          <h3 className="text-2xl md:text-4xl lg:text-5xl font-black text-primary leading-tight mb-4 md:mb-8 tracking-tighter">
            <span className="text-accent">지금</span> 준비하고 든든하게 운영하세요
          </h3>      
          <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-8 md:mb-12">
            {["구독자가 늘고", "조회수가 터지고", "굿즈 요청이 들어오고", "외부 협업 제안이 오면서"].map((item, i) => (
              <div key={i} className="bg-white px-5 py-2.5 md:px-8 md:py-4 rounded-full text-base md:text-xl text-primary font-black border border-border-light shadow-sm hover:border-accent transition-colors">
                {item}
              </div>
            ))}
          </div>

          <div className="bg-white border-2 border-accent/20 p-8 md:p-16 mb-12 max-w-4xl mx-auto shadow-2xl rounded-[2rem] relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-accent"></div>
            <p className="text-primary font-black text-xl md:text-2xl lg:text-3xl leading-tight">
              브랜드의 가치가 높아졌을 때는<br/>
              <span className="text-accent">이미 누군가 먼저 등록받았을 지도 모릅니다.</span>
            </p>
          </div>
        </div>
      </section>

      {/* Section 4 & 5 */}
      <section className="py-4 md:py-8 px-4 sm:px-6 lg:px-8 bg-bg-light border-t border-border-light">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
            
            {/* Section 4 */}
            <div className="flex flex-col">
              {/* Trademark Graphic - Minimized */}
              <div className="w-full h-40 md:h-64 bg-white rounded-[1.5rem] md:rounded-[2rem] mb-6 md:mb-8 flex flex-col items-center justify-center gap-4 md:gap-6 border border-border-light shadow-xl relative overflow-hidden group">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent"></div>
                <div className="relative z-10 w-16 h-16 md:w-28 md:h-28 bg-white rounded-full shadow-lg flex items-center justify-center border-4 md:border-8 border-primary transition-transform group-hover:scale-110">
                   <span className="text-3xl md:text-6xl font-black text-primary">R</span>
                </div>
                <h3 className="text-2xl md:text-4xl font-black text-primary tracking-tighter relative z-10">
                  상표 등록의 <span className="text-accent">효과</span>
                </h3>
              </div>

              <div className="space-y-4 md:space-y-6">
                {[
                  {
                    title: "1) 나만 사용할 수 있습니다",
                    desc: "상표 등록을 해두면 적어도 중요한 상품·서비스 영역에서 내 이름을 먼저 확보하는 효과가 있습니다.",
                  },
                  {
                    title: "2) 채널 운영이 든든해집니다",
                    desc: "상표가 있으면 이름을 계속 써도 되는지 불안해하지 않고, 안정적으로 수익화할 수 있습니다."
                  },
                  {
                    title: "3) 채널명을 바꾸는 리스크가 줄어듭니다",
                    desc: "브랜드가 커진 뒤 이름을 바꾸는 것은 큰 손실입니다. 상표는 이런 리스크를 미리 줄이는 장치입니다."
                  }
                ].map((item, idx) => (
                  <div key={idx} className="bg-white p-5 md:p-8 border border-border-light rounded-2xl shadow-sm hover:border-primary/30 hover:shadow-md transition-all">
                    <h4 className="font-black text-primary mb-2 md:mb-3 text-base md:text-xl">{item.title}</h4>
                    <p className="text-base sm:text-lg md:text-2xl text-secondary/70 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 6 */}
            <div className="flex flex-col">
              {/* Design Graphic - Minimized */}
              <div className="w-full h-40 md:h-64 bg-white rounded-[1.5rem] md:rounded-[2rem] mb-6 md:mb-8 flex flex-col items-center justify-center gap-4 md:gap-6 border border-border-light shadow-xl relative overflow-hidden group">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent via-transparent to-transparent"></div>
                <div className="relative z-10 w-16 h-16 md:w-28 md:h-28 border-4 md:border-8 border-accent rounded-[1.2rem] md:rounded-[2rem] flex items-center justify-center -rotate-6 bg-white shadow-xl transition-transform group-hover:scale-110">
                  <div className="w-8 h-8 md:w-14 md:h-14 bg-accent rounded-full"></div>
                </div>
                <h3 className="text-2xl md:text-4xl font-black text-primary tracking-tighter relative z-10">
                  디자인 등록의 <span className="text-accent">효과</span>
                </h3>
              </div>

              <div className="space-y-4 md:space-y-6">
                {[
                  {
                    title: "1) 상품화가 유리합니다",
                    desc: "유튜브 캐릭터는 스티커, 엽서, 키링, 인형, 문구, 의류 프린팅, 팬굿즈 등 다양한 방식으로 쉽게 상품화됩니다."
                  },
                  {
                    title: "2) 카피 굿즈를 막을 수 있습니다",
                    desc: "비슷한 그림체, 비슷한 캐릭터가 상품이 되어 판매되는 케이스를 디자인권으로 저지할 수 있습니다."
                  },
                  {
                    title: "3) 사업 확장이 탄탄해집니다",
                    desc: "캐릭터가 잘 되면 교육, 완구, 출판, 협업 등으로 이어질 수 있으며, 이때 디자인권이 있으면 신뢰를 줍니다."
                  }
                ].map((item, idx) => (
                  <div key={idx} className="bg-white p-5 md:p-8 border border-border-light rounded-2xl shadow-sm hover:border-accent/30 hover:shadow-md transition-all">
                    <h4 className="font-black text-primary mb-2 md:mb-3 text-base md:text-xl">{item.title}</h4>
                    <p className="text-base sm:text-lg md:text-2xl text-secondary/70 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Section 7 */}
      <section className="py-4 md:py-8 px-4 sm:px-6 lg:px-8 bg-bg-light border-t border-border-light">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-border-light p-6 md:p-10 lg:p-12 shadow-2xl rounded-[2.5rem] md:rounded-[4rem] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full -mr-48 -mt-48 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full -ml-48 -mb-48 blur-3xl"></div>

            <div className="mb-8 md:mb-12 text-center relative z-10">
              <h3 className="text-2xl sm:text-3xl md:text-6xl font-black text-primary leading-tight tracking-tighter mb-4 md:mb-6">
                <span className="text-accent">유튜브 IP 패키지</span>
              </h3>
              <p className="text-base sm:text-lg md:text-2xl text-secondary/60 font-medium leading-relaxed max-w-3xl mx-auto">
                상표나 디자인 등록이 필요한 필수 요소만 선별하여<br className="hidden md:block"/>
                <strong className="text-primary font-black">유튜버 캐릭터 IP 패키지로 제안</strong>드립니다.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-8 md:mb-12 relative z-10">
              {[
                {
                  title: "채널 이름 상표 검토 및 출원",
                  items: ["채널 이름", "콘텐츠 제목"]
                },
                {
                  title: "유튜버 활동명 상표 검토 및 출원",
                  items: ["활동명", "운영 닉네임"]
                },
                {
                  title: "캐릭터 이름 상표 검토 및 출원",
                  items: ["캐릭터 이름", "시리즈 이름"]
                },
                {
                  title: "캐릭터 디자인 검토 및 출원",
                  items: ["캐릭터 외형", "캐릭터 도안"]
                }
              ].map((pkg, idx) => (
                <div key={idx} className="bg-bg-light border border-border-light p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] hover:shadow-lg transition-all flex flex-col group">
                  <div className="flex flex-col gap-4 mb-6">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-primary text-white rounded-xl flex items-center justify-center font-black text-lg md:text-xl shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                      {idx + 1}
                    </div>
                    <h4 className="text-xl md:text-3xl font-black text-primary leading-tight">{pkg.title}</h4>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2 md:gap-3">
                    {pkg.items.map((item, i) => (
                      <div key={i} className="bg-white border border-border-light px-3 py-2 md:px-4 md:py-2.5 rounded-xl text-xs sm:text-sm md:text-lg font-bold text-primary flex items-center gap-2 shadow-sm">
                        <CheckCircle2 className="w-4 h-4 md:w-6 md:h-6 text-accent" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
      {/* Section 8 & CTA */}
            <div className="grid md:grid-cols-2 gap-6 md:gap-8 relative z-10">
              <div className="bg-bg-light border border-border-light p-6 md:p-8 shadow-sm rounded-[1.5rem] md:rounded-[2rem] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
                <h4 className="text-xl md:text-3xl font-black text-primary mb-4 md:mb-6 flex items-center gap-4">
                  <div className="w-2 h-6 md:w-2 md:h-8 bg-accent rounded-full"></div>
                  패키지의 장점
                </h4>
                <ul className="space-y-3 md:space-y-4 text-sm sm:text-base md:text-xl text-secondary/70 font-bold">
                  {[
                    "무엇을 먼저 보호해야 하는지 한 번에 정리 가능",
                    "상표와 디자인을 따로 알아보는 번거로움 감소",
                    "유튜버 운영 방식에 맞춰 우선순위 설정 가능",
                    "초기 채널도 부담을 낮춰 IP 보호 가능"
                  ].map((text, i) => (
                    <li key={i} className="flex items-start gap-3 md:gap-4">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 md:mt-3 shrink-0"></div>
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-bg-light border border-border-light p-6 md:p-8 shadow-sm rounded-[1.5rem] md:rounded-[2rem] relative overflow-hidden">
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/5 rounded-full -ml-16 -mb-16"></div>
                <h4 className="text-xl md:text-3xl font-black text-primary mb-4 md:mb-6 flex items-center gap-4">
                  <div className="w-2 h-6 md:w-2 md:h-8 bg-accent rounded-full"></div>
                  추천 대상
                </h4>
                <ul className="space-y-3 md:space-y-4 text-sm sm:text-base md:text-xl text-secondary/70 font-bold">
                  {[
                    "영상 조회수가 늘고있는 채널 크리에이터",
                    "채널명과 캐릭터명을 함께 키우는 유튜버",
                    "굿즈 판매를 준비 중인 유튜버",
                    "캐릭터를 직접 만들어 영상을 만드는 크리에이터"
                  ].map((text, i) => (
                    <li key={i} className="flex items-start gap-3 md:gap-4">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 md:mt-3 shrink-0"></div>
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Pricing Table */}
            <div className="mt-12 md:mt-16 relative z-10">
              <div className="overflow-x-auto rounded-[1.5rem] md:rounded-[2rem] border border-border-light shadow-sm">
                <table className="w-full border-collapse bg-white min-w-[600px] md:min-w-0">
                  <thead>
                    <tr className="bg-primary text-white">
                      <th className="py-4 px-6 md:py-6 md:px-8 text-base md:text-2xl font-black text-left">출원 패키지 구성</th>
                      <th className="py-4 px-6 md:py-6 md:px-8 text-base md:text-2xl font-black text-center whitespace-nowrap">정상가</th>
                      <th className="py-4 px-6 md:py-6 md:px-8 text-base md:text-2xl font-black text-center whitespace-nowrap">할인가</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light">
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 md:py-6 md:px-8 text-sm md:text-xl font-bold text-primary">상표 출원 (1개류 기준)</td>
                      <td className="py-4 px-6 md:py-6 md:px-8 text-sm md:text-xl font-medium text-secondary/40 text-center line-through whitespace-nowrap">22만원</td>
                      <td className="py-4 px-6 md:py-6 md:px-8 text-base md:text-2xl font-black text-accent text-center whitespace-nowrap">15만원</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 md:py-6 md:px-8 text-sm md:text-xl font-bold text-primary">디자인 출원 (1개 기준)</td>
                      <td className="py-4 px-6 md:py-6 md:px-8 text-sm md:text-xl font-medium text-secondary/40 text-center line-through whitespace-nowrap">38만원</td>
                      <td className="py-4 px-6 md:py-6 md:px-8 text-base md:text-2xl font-black text-accent text-center whitespace-nowrap">30만원</td>
                    </tr>
                    <tr className="bg-accent/5 hover:bg-accent/10 transition-colors">
                      <td className="py-4 px-6 md:py-6 md:px-8 text-sm md:text-xl font-bold text-primary">상표 + 디자인 출원 패키지</td>
                      <td className="py-4 px-6 md:py-6 md:px-8 text-sm md:text-xl font-medium text-secondary/40 text-center line-through whitespace-nowrap">60만원</td>
                      <td className="py-4 px-6 md:py-6 md:px-8 text-base md:text-2xl font-black text-accent text-center whitespace-nowrap">45만원</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-6 text-sm md:text-lg text-secondary/60 font-bold text-center">
                ※ 심사 대응 비용, 등록 비용은 별도로 부가됩니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 9: Professional Patent Firm Service */}
      <section className="py-8 md:py-16 px-4 sm:px-6 lg:px-8 bg-bg-light overflow-hidden relative border-y border-border-light">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="bg-white p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] border border-border-light shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full -ml-32 -mb-32 blur-3xl"></div>
            
            <div className="relative z-10 text-center">
              <h2 className="text-xl sm:text-2xl md:text-5xl font-black text-primary mb-6 md:mb-8 tracking-tighter">
                <span className="text-accent">전문 특허법인</span>의 등록 서비스
              </h2>

              <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-12 mb-8 md:mb-10">
                <div className="flex flex-col items-center">
                  <span className="text-secondary/50 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1">국내 상표 출원</span>
                  <span className="text-2xl sm:text-3xl md:text-5xl font-black text-primary flex items-baseline">40,000<span className="text-accent text-lg md:text-2xl ml-1">+</span><span className="text-xs md:text-lg ml-1 text-secondary/40">건</span></span>
                </div>
                <div className="w-px h-12 bg-border-light hidden md:block"></div>
                <div className="flex flex-col items-center">
                  <span className="text-secondary/50 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1">국내 디자인 출원</span>
                  <span className="text-2xl sm:text-3xl md:text-5xl font-black text-primary flex items-baseline">14,000<span className="text-accent text-lg md:text-2xl ml-1">+</span><span className="text-xs md:text-lg ml-1 text-secondary/40">건</span></span>
                </div>
              </div>

              <div className="space-y-4 md:space-y-8">
                <p className="text-lg sm:text-xl md:text-3xl text-secondary font-bold leading-tight">
                  경험이 풍부한 특허법인이<br className="hidden md:block" />
                  귀하의 브랜드와 콘텐츠를 <span className="text-primary border-b-2 md:border-b-4 border-accent/30">재산권</span>으로 보호해드립니다.
                </p>
                
                <div className="flex justify-center gap-2 md:gap-3">
                  <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-accent/30"></div>
                  <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-accent/30"></div>
                  <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-accent/30"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 10: Process & Application Form */}
      <section className="py-4 md:py-8 px-4 sm:px-6 lg:px-8 bg-bg-light">
        <div className="max-w-7xl mx-auto bg-white shadow-2xl border border-border-light flex flex-col lg:flex-row rounded-[2rem] md:rounded-[3rem] overflow-hidden">
          <div className="lg:w-5/12 bg-primary text-white p-6 md:p-12 flex flex-col justify-center relative">
            <div className="absolute inset-0 opacity-10 bg-[url('https://picsum.photos/seed/pattern/800/800')] bg-cover mix-blend-overlay"></div>
            <div className="relative z-10">
              <h3 className="text-xl sm:text-2xl md:text-4xl font-black mb-6 md:mb-10 tracking-tighter" style={{ color: 'white' }}>진행 절차</h3>
              <div className="space-y-5 md:space-y-8 relative">
                {/* Vertical Line */}
                <div className="absolute left-4 md:left-6 top-2 bottom-2 w-0.5 bg-accent/30"></div>
                
                {[
                  { step: "STEP 1", title: "채널명 입력" },
                  { step: "STEP 2", title: "검토 리포트" },
                  { step: "STEP 3", title: "출원 정보 입력" },
                  { step: "STEP 4", title: "결제" },
                  { step: "STEP 5", title: "출원" },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 md:gap-6 relative group">
                    <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl bg-accent flex items-center justify-center shrink-0 z-10 shadow-[0_0_20px_rgba(255,90,0,0.5)] transition-transform group-hover:scale-110">
                      <span className="text-white text-xs md:text-lg font-black">{idx + 1}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-accent text-[10px] md:text-sm font-black tracking-widest mb-0.5 md:mb-1 opacity-80">{item.step}</span>
                      <span className="text-white text-base sm:text-lg md:text-2xl font-bold">{item.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="lg:w-7/12 p-8 md:p-12">
            <h4 className="text-2xl md:text-4xl font-black text-primary mb-6 md:mb-8 tracking-tighter">무료 검토 신청</h4>
            
            <form className="space-y-4 md:space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2 md:space-y-3">
               <label className="block text-base md:text-xl font-bold text-primary">유튜브 채널명 또는 URL
               </label>
              <input
                 type="text"
                 name="channel_input"
                 value={channelInput}
                 onChange={(e) => setChannelInput(e.target.value)}
                 className="w-full bg-bg-light border border-border-light px-5 py-3 md:py-4 text-base md:text-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all rounded-xl md:rounded-2xl font-medium"
                 placeholder="예: 짤툰 또는 https://www.youtube.com/@example"
               />
              </div>
              <div className="space-y-2 md:space-y-3">
                <label className="block text-base md:text-xl font-bold text-primary">관심 서비스 유형
                  </label>
                    <div className="relative">
                        <select
                          name="interest_type"
                          value={interestType}
                          onChange={(e) => setInterestType(e.target.value)}
                          className="w-full bg-bg-light border border-border-light px-5 py-3 md:py-4 text-base md:text-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all appearance-none text-secondary rounded-xl md:rounded-2xl font-medium"
                        >
                          <option value="">선택해주세요</option>
                          <option value="상표">상표</option>
                          <option value="디자인">디자인</option>
                          <option value="상표+디자인">상표+디자인</option>
                        </select>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
                         <ArrowRight className="w-5 h-5 md:w-6 md:h-6 rotate-90" />
                        </div>
                       </div>
              </div>
              <div className="space-y-2 md:space-y-3">
                <label className="block text-base md:text-xl font-bold text-primary">연락받을 이메일
                </label>
                <input
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-bg-light border border-border-light px-5 py-3 md:py-4 text-base md:text-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all rounded-xl md:rounded-2xl font-medium"
                    placeholder="example@email.com"
                />
              </div>
              <div className="flex items-center gap-3 py-2">
                <input
                    type="checkbox"
                    id="privacy_agree"
                    name="privacy_agree"
                    checked={privacyAgree}
                    onChange={(e) => setPrivacyAgree(e.target.checked)}
                    className="w-5 h-5 md:w-6 md:h-6 rounded border-border-light text-accent focus:ring-accent accent-accent cursor-pointer"
                />
                <label
                  htmlFor="privacy_agree"
                  className="text-sm md:text-lg font-bold text-secondary/70 cursor-pointer"
                >
                  개인정보 수집·이용에 동의합니다.
                </label>
              </div>
              {errorMessage && (
                <p className="text-sm md:text-lg text-red-600 font-bold">
                  {errorMessage}
                </p>
              )}  
              
              {successMessage && (
                <p className="text-sm md:text-lg text-green-600 font-bold">
                  {successMessage}
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-accent text-white font-black text-xl md:text-3xl py-4 md:py-5 rounded-xl md:rounded-2xl hover:bg-[#e64500] transition-all mt-6 shadow-2xl shadow-accent/30 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "접수 중..." : "무료 검토 신청하기"}
              </button>
              
              <p className="text-sm md:text-lg text-secondary/50 text-center mt-6 font-medium">
                신청하시면 검토 결과를 안내드립니다.<br className="md:hidden"/> (24시간 이내/최대 2일)
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
    <footer className="bg-[#0f1738] text-[#C8CCD6] py-6 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 md:px-12">
        <div className="mb-4">
            <div className="flex items-center gap-2 md:gap-3 mb-4 text-xl md:text-2xl">
              <div className="w-[1em] h-[1em] bg-[#FF5A00] flex-shrink-0"></div>
              <div className="font-black tracking-tighter text-white text-2xl md:text-3xl">IPEDIA.</div>
            </div>
            <div className="text-xs md:text-sm space-y-1 text-white font-medium">
              <p>서울시 강남구 역삼로 114, 현죽빌딩 9층</p>
              <p>02. 6920. 8882</p>
              <p>010. 8936. 8203</p>
              <p>kjlee@ipedia.kr</p>
              <p>kjlee@sungampat.com</p>
            </div>
        </div>

        <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center text-[10px] tracking-[0.2em] font-bold gap-4 md:gap-0 text-white/70">
          <p className="leading-relaxed">© 2025 IPEDIA INTELLECTUAL PROPERTY SOLUTION. ALL RIGHTS RESERVED.</p>
          <div className="space-x-6 uppercase">
            <span className="text-[#FF5A00]">Built for Innovators</span>
          </div>
        </div>
      </div>
    </footer>
    </div>
  );
}
