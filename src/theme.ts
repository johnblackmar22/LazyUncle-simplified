import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    brand: {
      50: '#E6F6FF',
      100: '#BAE3FF',
      200: '#7CC4FA',
      300: '#47A3F3',
      400: '#2186EB',
      500: '#0967D2',
      600: '#0552B5',
      700: '#03449E',
      800: '#01337D',
      900: '#002159',
    },
    orange: {
      50: '#FFF7ED',
      100: '#FFEDD5',
      200: '#FED7AA',
      300: '#FDBA74',
      400: '#FB923C', // This is our primary orange
      500: '#F97316',
      600: '#EA580C',
      700: '#C2410C',
      800: '#9A3412',
      900: '#7C2D12',
    },
    neutral: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#E5E5E5',
      300: '#D4D4D4',
      400: '#A3A3A3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },
  },
  fonts: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'semibold',
        borderRadius: 'lg',
        transition: 'all 0.2s',
      },
      variants: {
        solid: {
          _hover: {
            transform: 'translateY(-1px)',
            boxShadow: 'lg',
          },
        },
        outline: {
          _hover: {
            transform: 'translateY(-1px)',
            boxShadow: 'md',
          },
        },
        ghost: {
          _hover: {
            transform: 'translateY(-1px)',
          },
        },
      },
      sizes: {
        lg: {
          px: 8,
          py: 3,
          fontSize: 'lg',
          borderRadius: 'xl',
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          borderRadius: 'xl',
          boxShadow: 'md',
          transition: 'all 0.2s',
          _hover: {
            boxShadow: 'lg',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    Tooltip: {
      baseStyle: {
        bg: 'gray.700',
        color: 'white',
        fontSize: 'sm',
        px: 2,
        py: 1,
        borderRadius: 'md',
        fontWeight: 'medium',
        maxW: '320px',
        zIndex: 'tooltip',
      },
      defaultProps: {
        placement: 'top',
        hasArrow: true,
        openDelay: 500,
        closeDelay: 0,
      },
    },
  },
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
});

export default theme; 