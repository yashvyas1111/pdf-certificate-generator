import User from "../models/AuthorizedUser.js";

export const loginWithEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Later you can add JWT token here
    return res.status(200).json({ success: true, message: 'Login successful', user });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
