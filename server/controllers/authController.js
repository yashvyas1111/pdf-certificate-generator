import User from "../models/AuthorizedUser.js";

export const loginWithEmail = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Email and password are required' });

  try {
    const user = await User.findOne({ email });

    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });

    // Compare plain password directly (no hashing)
    if (user.password !== password)
      return res.status(401).json({ success: false, message: 'Invalid password' });

    return res.status(200).json({ success: true, message: 'Login successful', user });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
