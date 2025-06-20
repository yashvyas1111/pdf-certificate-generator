export const logout = () => {
  localStorage.removeItem('user');  // or your token key
  window.location.href = '/login';  // redirect to login page
};

