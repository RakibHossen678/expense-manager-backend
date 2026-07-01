import { ApiError } from '../errors/ApiError.js';
import { User } from '../modules/auth/user.model.js';
import { verifyAuthToken } from '../helper/utils/authToken.js';

const getBearerToken = (authorizationHeader) => {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
};

export const requireAuth = async (req, res, next) => {
  try {
    const token = getBearerToken(req.headers.authorization);
    if (!token) {
      throw new ApiError(401, 'Authentication required');
    }

    const payload = verifyAuthToken(token);
    const user = await User.findById(payload.sub);

    if (!user || user.tokenVersion !== payload.tokenVersion) {
      throw new ApiError(401, 'Your session is no longer valid');
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      tokenVersion: user.tokenVersion,
    };

    next();
  } catch (error) {
    next(error);
  }
};
