export type Theme = {
  name: string
  label: string
  activeColor: string
  lightColors: {
    background: string
    foreground: string
    primary: string
    ring: string
  }
  darkColors: {
    background: string
    foreground: string
    primary: string
    ring: string
  }
}

export const themes: Theme[] = [
  {
    name: "zinc",
    label: "Zinc",
    activeColor: "rgb(244 244 245)",
    lightColors: {
      background: "0 0% 100%",
      foreground: "240 10% 3.9%",
      primary: "240 5.9% 10%",
      ring: "240 5.9% 10%",
    },
    darkColors: {
      background: "240 10% 3.9%",
      foreground: "0 0% 98%",
      primary: "0 0% 98%",
      ring: "0 0% 98%",
    },
  },
  {
    name: "red",
    label: "Red",
    activeColor: "rgb(254 242 242)",
    lightColors: {
      background: "0 0% 100%",
      foreground: "0 0% 3.9%",
      primary: "0 72.2% 50.6%",
      ring: "0 72.2% 50.6%",
    },
    darkColors: {
      background: "0 0% 3.9%",
      foreground: "0 0% 98%",
      primary: "0 72.2% 50.6%",
      ring: "0 72.2% 50.6%",
    },
  },
  // Add more themes as needed
]

