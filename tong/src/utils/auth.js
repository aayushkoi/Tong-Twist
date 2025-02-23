import { getAuth } from 'firebase/auth';

export const getCurrentUser = () => {
  const auth = getAuth();
  return auth.currentUser;
};