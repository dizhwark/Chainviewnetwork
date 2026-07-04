// Validated categorical palette (see dataviz skill references/palette.md).
// Fixed hue order — never reassign a slot to a different category at runtime.
export const CATEGORICAL_LIGHT = [
  '#2a78d6', // blue
  '#1baf7a', // aqua
  '#eda100', // yellow
  '#008300', // green
  '#4a3aa7', // violet
  '#e34948', // red
  '#e87ba4', // magenta
  '#eb6834', // orange
]

export const CATEGORICAL_DARK = [
  '#3987e5',
  '#199e70',
  '#c98500',
  '#008300',
  '#9085e9',
  '#e66767',
  '#d55181',
  '#d95926',
]

export const STATUS = {
  good: { light: '#0ca30c', dark: '#0ca30c' },
  critical: { light: '#d03b3b', dark: '#d03b3b' },
}

export const SEQUENTIAL_BLUE = ['#cde2fb', '#9ec5f4', '#5598e7', '#2a78d6', '#184f95']

export function prefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function categoricalColors(count: number, dark: boolean): string[] {
  const ramp = dark ? CATEGORICAL_DARK : CATEGORICAL_LIGHT
  const colors: string[] = []
  for (let i = 0; i < count; i += 1) colors.push(ramp[i % ramp.length])
  return colors
}
