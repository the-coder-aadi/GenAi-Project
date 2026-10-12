import express from "express"
import cors from "cors"
import chatbot from "./chatbot.js"
import Razorpay from "razorpay"
import crypto from "crypto"
import User from "./models/User.js"
import cookieParser from "cookie-parser";



const App = express()


App.post(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {

    try {
      console.log("RAZORPAY WEBHOOK RECEIVED");

      // 1. Raw body
      const webhookBody = req.body.toString();

      // 2. Razorpay signature
      const razorpaySignature =
        req.headers["x-razorpay-signature"];

      if (!razorpaySignature) {
        return res.status(400).json({
          success: false,
          message: "Webhook signature missing",
        });
      }

      // 3. Generate expected signature
      const expectedSignature = crypto
        .createHmac(
          "sha256",
          process.env.RAZORPAY_WEBHOOK_SECRET
        )
        .update(webhookBody)
        .digest("hex");

      // 4. Verify webhook
      if (expectedSignature !== razorpaySignature) {
        console.log("Invalid webhook signature");

        return res.status(400).json({
          success: false,
          message: "Invalid webhook signature",
        });
      }

      console.log("Webhook signature verified");

      // 5. Parse webhook data
      const webhookData = JSON.parse(webhookBody);

      console.log("Webhook event:", webhookData.event);

      // We only configured payment.captured
      if (webhookData.event !== "payment.captured") {
        return res.status(200).json({
          success: true,
        });
      }

      const payment =
        webhookData.payload.payment.entity;

      const orderId = payment.order_id;
      const paymentId = payment.id;

      console.log("Order ID:", orderId);
      console.log("Payment ID:", paymentId);

      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: "Order ID missing",
        });
      }

      // 6. Find the user who created this order
      const user = await User.findOne({
        razorpayOrderId: orderId,
      });

      // If no user found, don't keep retrying forever
      // This can also mean payment was already processed.
      if (!user) {
        console.log(
          "No pending user found for order:",
          orderId
        );

        return res.status(200).json({
          success: true,
        });
      }

      // 7. Pending plan must exist
      if (!user.pendingPlan) {
        console.log(
          "No pending plan for order:",
          orderId
        );

        return res.status(200).json({
          success: true,
        });
      }

      const purchasedPlan = user.pendingPlan;

if (
  user.plan === "premium" &&
  purchasedPlan === "pro" &&
  user.planExpiresAt &&
  user.planExpiresAt > new Date()
) {
  console.log(
    "Premium plan still active. Pro purchase ignored."
  );

  return res.status(200).json({
    success: true,
  });
}

await activatePayment(user, purchasedPlan);

      console.log(
        "Webhook payment processed successfully",
        {
          orderId,
          paymentId,
          plan: purchasedPlan,
        }
      );

      return res.status(200).json({
        success: true,
      });
    } catch (error) {
      console.error("Webhook error:", error);

      return res.status(500).json({
        success: false,
      });
    }
  }
);

async function activatePayment(user, purchasedPlan) {
  const now = new Date();
  const planExpiresAt = new Date();

  if (
    user.plan === purchasedPlan &&
    user.planExpiresAt &&
    user.planExpiresAt > now
  ) {
    planExpiresAt.setTime(user.planExpiresAt.getTime());
    planExpiresAt.setDate(planExpiresAt.getDate() + 30);
  } else {
    planExpiresAt.setDate(planExpiresAt.getDate() + 30);
  }

  user.plan = purchasedPlan;
  user.planExpiresAt = planExpiresAt;

  user.razorpayOrderId = null;
  user.pendingPlan = null;

  await user.save();
}

App.use(express.json())
App.use(
  cors({
    // origin: "https://genai-project-1-k67z.onrender.com",
origin:"http://localhost:5173",
credentials: true,
  })
)
App.use(cookieParser());

App.use("/", chatbot)


const razorpay = new Razorpay({
  key_id: process.env.TEST_API_KEY,
  key_secret: process.env.TEST_KEY_SECRET,
});

App.post("/api/payment/create-order", async (req, res) => {
  const {plan } = req.body
  try {
const sessionId = req.cookies.sessionId;

       if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required",
      });
    }

      const user = await User.findOne({ sessionId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.plan === "premium" && plan === "pro") {
  return res.status(400).json({
    success: false,
    message: "Your Premium plan is still active. You can buy Pro after it expires.",
  });
}
    
    let amount;

        if (plan === "pro") {
      amount = 14900; // ₹149
    } else if (plan === "premium") {
      amount = 29900; // ₹299
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid plan",
      });
    }

    const options = {
      amount: amount, // ₹149
      currency: "INR",
      receipt: `${plan}_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

 await User.findOneAndUpdate(
      { sessionId: sessionId },
      {
        razorpayOrderId: order.id,
        pendingPlan: plan,
      }
    );

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Razorpay order error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to create payment order",
    });
  }
});


App.post("/api/payment/verify", async (req, res) => {
  
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const sessionId = req.cookies.sessionId;
    // Check required values
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !sessionId
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment details are missing",
      });
    }

    // Create expected signature
    const body =
      razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.TEST_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    // Compare signatures
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    const user = await User.findOne({
      sessionId: sessionId,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

     if (user.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment order",
      });
    }

    const purchasedPlan = user.pendingPlan;

    if (!purchasedPlan) {
      return res.status(400).json({
        success: false,
        message: "No pending plan found",
      });
    }
if (
  user.plan === "premium" &&
  purchasedPlan === "pro" &&
  user.planExpiresAt &&
  user.planExpiresAt > new Date()
) {
  return res.status(400).json({
    success: false,
    message: "Your Premium plan is still active.",
  });
}

await activatePayment(user, purchasedPlan);

    // Payment verified
    console.log("Payment verified successfully");

    res.json({
      success: true,
      message: "Payment verified successfully",
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    });

  } catch (error) {
    console.error("Payment verification error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to verify payment",
    });
  }
});


App.get("/user/planinfo", async (req, res) => {
  try {
    const sessionId = req.cookies.sessionId;

    if (!sessionId) {
      return res.status(401).json({
        success: false,
        msg: "Session not found",
      });
    }

    const plandata = await User.findOne({
      sessionId: sessionId,
    });

    if (!plandata) {
      return res.status(401).json({
        success: false,
        msg: "User not found",
      });
    }

    res.json({
      success: true,
      data: plandata,
    });

  } catch (error) {
    console.error("Plan info error:", error);

    res.status(500).json({
      success: false,
      msg: "Something went wrong to get plan information",
    });
  }
});

const PORT = process.env.PORT || 3000;

App.listen(PORT, "0.0.0.0", () => {
  console.log(`server running on ${PORT}`);
});


