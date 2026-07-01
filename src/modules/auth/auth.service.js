import { ApiError } from '../../errors/ApiError.js';
import { createAuthToken } from '../../helper/utils/authToken.js';
import { User } from './user.model.js';

const sanitizeUser = (user) => ({
  id: user._id.toString(),
  name: user.name || '',
  email: user.email,
  tokenVersion: user.tokenVersion,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const register = async ({ name = '', email, password }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'An account with that email already exists');
  }

  const user = new User({ name, email });
  user.setPassword(password);

  await user.save();

  return {
    user: sanitizeUser(user),
    token: createAuthToken({
      userId: user._id,
      tokenVersion: user.tokenVersion,
    }),
  };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+passwordHash');

  if (!user || !user.verifyPassword(password)) {
    throw new ApiError(401, 'Invalid email or password');
  }

  return {
    user: sanitizeUser(user),
    token: createAuthToken({
      userId: user._id,
      tokenVersion: user.tokenVersion,
    }),
  };
};

const me = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return sanitizeUser(user);
};

const logout = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  user.tokenVersion += 1;
  await user.save();

  return true;
};

export const authService = {
  register,
  login,
  me,
  logout,
};
