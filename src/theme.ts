import { MD3LightTheme, type MD3Theme } from "react-native-paper";

export const appTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 18,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#245A43",
    onPrimary: "#FFFFFF",
    primaryContainer: "#DCEFE3",
    onPrimaryContainer: "#123B2A",
    secondary: "#B75D3B",
    onSecondary: "#FFFFFF",
    background: "#F5F4ED",
    surface: "#FFFDF8",
    onSurface: "#202A23",
    surfaceVariant: "#E9EAE1",
    onSurfaceVariant: "#535E55",
    outline: "#778078",
    outlineVariant: "#D8DDD4",
    error: "#B3261E",
  },
};
