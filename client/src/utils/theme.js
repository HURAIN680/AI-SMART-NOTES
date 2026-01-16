export const setTheme = (theme) => {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  } else {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }
};

export const initTheme = () => {
  const savedTheme = localStorage.getItem("theme") || "light";
  setTheme(savedTheme);
};
