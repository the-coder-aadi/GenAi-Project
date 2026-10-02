import express from "express"
import cors from "cors"
import chatbot from "./chatbot.js"
import Razorpay from "razorpay"
import crypto from "crypto"
import User from "./models/User.js"


const App = express()
App.use(express.json())
App.use(
  cors({
    origin: "https://genai-project-1-k67z.onrender.com",
  })
)

App.use("/", chatbot)

console.log("KEY:", process.env.TEST_API_KEY);
console.log("SECRET EXISTS:", !!process.env.TEST_KEY_SECRET);



const razorpay = new Razorpay({
  key_id: process.env.TEST_API_KEY,
  key_secret: process.env.TEST_KEY_SECRET,
});

App.post("/api/payment/create-order", async (req, res) => {
  const {plan, sessionId } = req.body
  try {

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
      receipt: `pro_${Date.now()}`,
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
        sessionId,
    } = req.body;

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

   const planExpiresAt = new Date();

if (
  user.plan === purchasedPlan &&
  user.planExpiresAt &&
  user.planExpiresAt > new Date()
) {
  planExpiresAt.setTime(user.planExpiresAt.getTime());

  planExpiresAt.setDate(
    planExpiresAt.getDate() + 30
  );
} else {
  planExpiresAt.setDate(
    planExpiresAt.getDate() + 30
  );
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

    // Activate plan
    user.plan = purchasedPlan;
    user.planExpiresAt = planExpiresAt;

    // Clear temporary payment data
    user.razorpayOrderId = null;
    user.pendingPlan = null;

    await user.save();


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


App.get("/user/planinfo/:sessionid",async(req,res)=>{
  try {
    const {sessionid} = req.params
    const plandata = await User.findOne({sessionId: sessionid})
    if (!plandata) {
      return res.json({
        success:false,
        msg:"user not found"
      })
    }
    res.json({
      success:true,
      data:plandata
    })
  } catch (error) {
    res.json({
      success:false,
      msg:"something went wrong to get plan information"
    })
  }
})

const PORT = process.env.PORT || 3000;

App.listen(PORT, "0.0.0.0", () => {
  console.log(`server running on ${PORT}`);
});


