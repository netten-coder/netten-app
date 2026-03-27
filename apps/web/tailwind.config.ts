import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark:    '#041E17',
          DEFAULT: '#1D9E75',
          light:   '#25C28F',
          muted:   '#E6F7F1',
        },
        surface: {
          DEFAULT: '#0D2B22',
          card:    '#112D24',
          hover:   '#163830',
          border:  '#1F4035',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'brand-gradient': 'linear-gradient(135deg, #1D9E75 0%, #25C28F 100%)',
      },
    },
  },
  plugins: [],
}

export default config
