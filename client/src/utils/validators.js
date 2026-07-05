export const isValidEmail = (email) => /^\S+@\S+\.\S+$/.test(email);

export const validateRegisterForm = ({ name, email, password }) => {
  const errors = {};
  if (!name || name.trim().length === 0) errors.name = "Name is required";
  if (!email) errors.email = "Email is required";
  else if (!isValidEmail(email)) errors.email = "Enter a valid email address";
  if (!password) errors.password = "Password is required";
  else if (password.length < 6)
    errors.password = "Password must be at least 6 characters";
  return errors;
};

export const validateLoginForm = ({ email, password }) => {
  const errors = {};
  if (!email) errors.email = "Email is required";
  else if (!isValidEmail(email)) errors.email = "Enter a valid email address";
  if (!password) errors.password = "Password is required";
  return errors;
};
