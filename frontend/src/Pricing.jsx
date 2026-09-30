
import React from "react";
import {
  Check,
  Zap,
  Crown,
  Sparkles,
  MessageSquare,
  FileText,
  Search,
  Trophy,
  ArrowRight,
} from "lucide-react";
import PaymentResultPopup from "./PaymentResultPopup";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";



const plans = [
  {
    name: "Free",
    price: "0",
    description: "Get started with essential AI tools.",
    icon: Sparkles,
    popular: false,
    button: "Free Plan",
    buttonStyle: "bg-slate-100 text-slate-500 cursor-default",
    limits: {
      rpm: "10",
      rpd: "200",
      tpm: "4,000",
      tpd: "50,000",
    },
    features: [
      "AI Chat",
      "PDF Chat",
      "PDF Summary",
      "AI Quiz",
      "Web Search",
    ],
  },
  {
    name: "Pro",
    price: "19",
    description: "More power for everyday AI usage.",
    icon: Zap,
    popular: true,
    button: "Upgrade to Pro",
    buttonStyle:
      "bg-slate-900 text-white hover:bg-slate-800",
    limits: {
      rpm: "15",
      rpd: "400",
      tpm: "6,000",
      tpd: "100,000",
    },
    features: [
      "AI Chat",
      "PDF Chat",
      "PDF Summary",
      "AI Quiz",
      "Web Search",
    ],
  },
  {
    name: "Premium",
    price: "29",
    description: "Maximum limits for power users.",
    icon: Crown,
    popular: false,
    button: "Get Premium",
    buttonStyle:
      "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500",
    limits: {
      rpm: "20",
      rpd: "600",
      tpm: "7,000",
      tpd: "150,000",
    },
    features: [
      "AI Chat",
      "PDF Chat",
      "PDF Summary",
      "AI Quiz",
      "Web Search",
    ],
  },
];

const comparison = [
  {
    icon: MessageSquare,
    name: "AI Chat",
    description: "Intelligent AI conversations",
  },
  {
    icon: FileText,
    name: "PDF Chat",
    description: "Chat with your uploaded documents",
  },
  {
    icon: Search,
    name: "Web Search",
    description: "AI-powered web search",
  },
  {
    icon: Trophy,
    name: "Quiz Mode",
    description: "Random and PDF-based quizzes",
  },
  {
    icon: FileText,
    name: "PDF Summary",
    description: "Generate summaries from your PDFs",
  },
];



const key = import.meta.env.VITE_RAZORPAY_KEY_ID;

const handlepayment = async (plan) => {
  try {
    // 1. Backend se order create karo
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/payment/create-order`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
          body: JSON.stringify({
      plan: plan,
        sessionId: localStorage.getItem("chatid"),
    }),
      }
    );

    const data = await response.json();

    if (!data.success) {
      alert(data.message);
      return;
    }

    // 2. Razorpay Checkout options
    const options = {
      key: key,
      amount: data.order.amount,
      currency: data.order.currency,
      name: "dummary name",
      description: "Pro Plan",
      order_id: data.order.id,

   
      handler: async function (response) {
        console.log("Payment response:", response);

        try {

          // ==========================================
          // STEP 4: SEND PAYMENT TO BACKEND
          // ==========================================

          const verifyResponse = await fetch(
            `${import.meta.env.VITE_API_URL}/api/payment/verify`,
            {
              method: "POST",

              headers: {
                "Content-Type": "application/json",
              },

              body: JSON.stringify({
                razorpay_order_id:
                  response.razorpay_order_id,

                razorpay_payment_id:
                  response.razorpay_payment_id,

                razorpay_signature:
                  response.razorpay_signature,
                    sessionId: localStorage.getItem("chatid"),
              }),
            }
          );


          const verifyData =
            await verifyResponse.json();


          // ==========================================
          // STEP 5: CHECK VERIFICATION RESULT
          // ==========================================

         if (verifyData.success) {

  console.log(
    "Payment verified:",
    verifyData
  );

  setPaymentSuccess(true);
  setPaymentMessage(
    verifyData.message || "Payment successful and verified!"
  );
  setPaymentPopupOpen(true);

} else {

  console.log("VERIFY RESPONSE:", verifyData);

  setPaymentSuccess(false);
  setPaymentMessage(
    verifyData.message || "Payment verification failed"
  );
  setPaymentPopupOpen(true);

}

        } catch (error) {

          console.error(
            "Verification error:",
            error
          );

         setPaymentSuccess(false);
setPaymentMessage(
  "Something went wrong while verifying payment"
);
setPaymentPopupOpen(true);
        }
      },

      theme: {
        color: "#7c3aed",
      },
    };

    // 3. Checkout open karo
    const razorpay = new window.Razorpay(options);

    razorpay.open();
  } catch (error) {
    console.error("Payment error:", error);
  }
};

function LimitRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0">
      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="text-sm font-semibold text-slate-900">
        {value}
      </span>
    </div>
  );
}

function PlanCard({ plan, currentPlan, planExpiresAt }) {
  
    const Icon = plan.icon;

  const isCurrentPlan =
    currentPlan === plan.name.toLowerCase();

  return (
    <div
      className={`
        relative flex h-full flex-col rounded-3xl border bg-white p-6
        transition-all duration-300
        ${
          plan.popular
            ? "border-violet-400 shadow-[0_20px_60px_rgba(124,58,237,0.18)] lg:-translate-y-3"
            : "border-slate-200 shadow-sm hover:-translate-y-1 hover:shadow-xl"
        }
      `}
    >
      {/* Popular Badge */}
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg">
            <Sparkles size={13} />
            MOST POPULAR
          </div>
        </div>
      )}

      {/* Plan Header */}
      <div className="mb-6 flex items-center gap-3">
        <div
          className={`
            flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl
            ${
              plan.name === "Premium"
                ? "bg-violet-100 text-violet-600"
                : plan.name === "Pro"
                ? "bg-slate-100 text-slate-900"
                : "bg-slate-100 text-slate-500"
            }
          `}
        >
          <Icon size={21} />
        </div>

        <div>
          <h3 className="font-bold text-slate-900">
            {plan.name}
          </h3>

          {isCurrentPlan && (
  <span className="mt-2 inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
    CURRENT PLAN
  </span>
)}

{isCurrentPlan && planExpiresAt && (
  <p className="mt-2 text-xs text-slate-500">
    Expires on{" "}
    {new Date(planExpiresAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}
  </p>
)}

          <p className="text-xs text-slate-500">
            {plan.description}
          </p>
        </div>
      </div>

      {/* Price */}
      <div className="mb-7">
        <div className="flex items-end gap-1">
          <span className="text-5xl font-black tracking-tight text-slate-950">
            ₹{plan.price}
          </span>

          <span className="mb-2 text-sm text-slate-400">
            / month
          </span>
        </div>
      </div>

      {/* Button */}
<button
  disabled={plan.name === "Free"}
  onClick={() => {
    if (plan.name === "Pro") {
      handlepayment("pro");
    }
    if (plan.name === "Premium") {
        handlepayment("premium");
    }
  }}
  className={`
    mb-7 flex w-full items-center justify-center gap-2
    rounded-xl px-5 py-3.5 text-sm font-bold
    transition-all
    ${plan.buttonStyle}
  `}
>
        {plan.button}

        {plan.name !== "Free" && (
          <ArrowRight size={16} />
        )}
      </button>

      {/* Usage Limits */}
      <div className="mb-7">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
          Usage Limits
        </p>

        <div className="rounded-2xl bg-slate-50 px-4">
          <LimitRow
            label="Requests / minute"
            value={plan.limits.rpm}
          />

          <LimitRow
            label="Requests / day"
            value={plan.limits.rpd}
          />

          <LimitRow
            label="Tokens / minute"
            value={plan.limits.tpm}
          />

          <LimitRow
            label="Tokens / day"
            value={plan.limits.tpd}
          />
        </div>
      </div>

      {/* Features */}
      <div className="mt-auto">
        <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
          Included
        </p>

        <div className="space-y-3">
          {plan.features.map((feature) => (
            <div
              key={feature}
              className="flex items-center gap-3 text-sm text-slate-600"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Check
                  size={13}
                  strokeWidth={3}
                />
              </span>

              {feature}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}



export default function Pricing() {
  const [currentPlan, setCurrentPlan] = useState(
  localStorage.getItem("currentPlan") || "free"
);

const [paymentPopupOpen, setPaymentPopupOpen] = useState(false);
const [paymentSuccess, setPaymentSuccess] = useState(false);
const [paymentMessage, setPaymentMessage] = useState("");

const [planExpiresAt, setPlanExpiresAt] = useState(
  localStorage.getItem("planExpiresAt") || null
);

  
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fafafa] text-slate-900">

      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-180px] h-[450px] w-[700px] -translate-x-1/2 rounded-full bg-violet-200/30 blur-3xl" />

        <div className="absolute right-[-150px] top-[500px] h-[300px] w-[300px] rounded-full bg-indigo-200/20 blur-3xl" />

        <div className="absolute left-[-150px] top-[900px] h-[300px] w-[300px] rounded-full bg-blue-200/20 blur-3xl" />
      </div>

<button
  onClick={() => window.history.back()}
  className="absolute left-4 top-4 sm:top-6 z-10 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-violet-600 sm:left-6"
>
  <ArrowLeft size={18} />
  Back
</button>
      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-5 pb-12 pt-18 sm:pt-14 text-center sm:px-6 lg:px-8">

        <div className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-bold text-violet-700">
          <Sparkles size={14} />
          SIMPLE & FLEXIBLE PLANS
        </div>

        <h1 className="mx-auto max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl md:text-6xl">
          Choose the plan that

          <span className="block bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
            works for you.
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
          Get more from your AI experience with higher
          usage limits, faster access, and more flexibility.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="relative mx-auto grid max-w-6xl grid-cols-1 gap-6 px-5 pb-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
{plans.map((plan) => ( 
  <PlanCard 
    key={plan.name} 
    plan={plan}
    currentPlan={currentPlan}
    planExpiresAt={planExpiresAt}
  /> 
))}
      </section>

      {/* Comparison */}
      <section className="relative border-y border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">

          {/* Heading */}
          <div className="mb-12 text-center">

            <p className="mb-3 text-sm font-bold uppercase tracking-wider text-violet-600">
              Compare Plans
            </p>

            <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Everything you need in one place
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-slate-500">
              All plans include the core features. Upgrade
              your plan to unlock higher usage limits.
            </p>
          </div>

          {/* Comparison Table */}
          <div className="overflow-hidden rounded-3xl border border-slate-200">

            {/* Desktop Header */}
            <div className="hidden grid-cols-4 bg-slate-50 p-5 md:grid">

              <div className="font-bold text-slate-700">
                Feature
              </div>

              <div className="text-center text-sm font-bold text-slate-500">
                Free
              </div>

              <div className="text-center text-sm font-bold text-slate-900">
                Pro
              </div>

              <div className="text-center text-sm font-bold text-violet-600">
                Premium
              </div>

            </div>

            {/* Rows */}
            {comparison.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.name}
                  className={`
                    grid gap-4 p-5
                    md:grid-cols-4 md:items-center
                    ${
                      index !== comparison.length - 1
                        ? "border-b border-slate-100"
                        : ""
                    }
                  `}
                >

                  {/* Feature */}
                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                      <Icon size={18} />
                    </div>

                    <div>
                      <p className="font-semibold text-slate-800">
                        {feature.name}
                      </p>

                      <p className="text-xs text-slate-400">
                        {feature.description}
                      </p>
                    </div>

                  </div>

                  {/* Free */}
                  <div className="flex items-center justify-between md:justify-center">

                    <span className="text-xs text-slate-400 md:hidden">
                      Free
                    </span>

                    <Check
                      className="text-emerald-500"
                      size={19}
                    />

                  </div>

                  {/* Pro */}
                  <div className="flex items-center justify-between md:justify-center">

                    <span className="text-xs text-slate-400 md:hidden">
                      Pro
                    </span>

                    <Check
                      className="text-emerald-500"
                      size={19}
                    />

                  </div>

                  {/* Premium */}
                  <div className="flex items-center justify-between md:justify-center">

                    <span className="text-xs text-slate-400 md:hidden">
                      Premium
                    </span>

                    <Check
                      className="text-emerald-500"
                      size={19}
                    />

                  </div>

                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative px-5 py-12 sm:px-6">

        <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-14 text-center shadow-2xl sm:px-10">

          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-violet-300">
            <Crown size={24} />
          </div>

          <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            Ready for more?
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            Upgrade your plan and get higher limits for
            your AI conversations, PDFs, quizzes,
            summaries, and web search.
          </p>

          <button  onClick={() => handlepayment("pro")} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-slate-100">
            Upgrade to Pro
            <ArrowRight size={16} />
          </button>

        </div>
      </section>

      {/* Footer */}
      <div className="relative pb-10 text-center">
        <p className="text-xs text-slate-400">
          Upgrade or change your plan anytime.
        </p>
      </div>

      <PaymentResultPopup
  isOpen={paymentPopupOpen}
  isSuccess={paymentSuccess}
  message={paymentMessage}
  onClose={() => setPaymentPopupOpen(false)}
/>

    </main>
  );
}

