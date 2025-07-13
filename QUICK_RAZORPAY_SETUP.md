# 🚀 Quick Razorpay Setup (5 minutes)

Your payment integration is ready but needs **real Razorpay API keys** to work.

## ⚡ Get Test API Keys (Free)

### Step 1: Create Razorpay Account
1. Go to [https://dashboard.razorpay.com/signup](https://dashboard.razorpay.com/signup)
2. Sign up with your email (it's free)
3. Verify your email address

### Step 2: Get Test API Keys
1. Login to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Make sure you're in **Test Mode** (top-left toggle)
3. Go to **Settings** → **API Keys** in the sidebar
4. Click **Generate Test Key** if no keys exist
5. Copy the **Key ID** and **Key Secret**

### Step 3: Update Environment Variables
Open `passenger/.env.local` and replace:

```bash
# Replace these lines:
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_secret_key_here
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id_here

# With your actual keys:
RAZORPAY_KEY_ID=rzp_test_1234567890abcdef  # Your actual Key ID
RAZORPAY_KEY_SECRET=abcdef1234567890abcdef1234567890abcdef  # Your actual Key Secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_1234567890abcdef  # Same as Key ID
```

### Step 4: Restart Development Server
```bash
# Stop the server (Ctrl+C) and restart
npm run dev
```

## ✅ Test Payment Flow

1. **Go to Payments**: Dashboard → Payments → Pay Now
2. **Select Payment Method**: Choose UPI, Card, etc.
3. **Test Credentials**:
   
   **UPI Testing:**
   - UPI ID: `success@razorpay` (Success)
   - UPI ID: `failure@razorpay` (Failure)
   
   **Card Testing:**
   - Card Number: `4111 1111 1111 1111` (Success)
   - Expiry: Any future date
   - CVV: Any 3 digits
   - Name: Any name

## 🔧 Troubleshooting

### "Authentication failed" Error
- ✅ Check if API keys are correctly set in `.env.local`
- ✅ Ensure no extra spaces in the keys
- ✅ Make sure you're using **Test Mode** keys (start with `rzp_test_`)
- ✅ Restart the development server after changing environment variables

### "Payment gateway not loaded" Error
- ✅ Check if `NEXT_PUBLIC_RAZORPAY_KEY_ID` is set
- ✅ Clear browser cache and reload

### Environment Variable Check
The console will show configuration status. Look for:
```
Razorpay Config Check: {
  hasKeyId: true,
  keyIdFormat: 'Valid',
  hasKeySecret: true,
  keySecretLength: 32
}
```

## 📞 Quick Help

- **Razorpay Test Mode**: Always free, no charges
- **API Documentation**: [https://razorpay.com/docs/](https://razorpay.com/docs/)
- **Dashboard**: [https://dashboard.razorpay.com/](https://dashboard.razorpay.com/)

**Once you add the API keys, the payment system will work immediately!** 🎉 