import React, { useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Stack,
  Text,
  SimpleGrid,
  Icon,
  useBreakpointValue,
  Image,
  HStack,
} from '@chakra-ui/react';
import { FaRegCalendarCheck, FaRegSmile, FaRegCheckCircle, FaTruck, FaGift } from 'react-icons/fa';
import SmallLogo from '/Logos/Small-logo.svg';
import SmallLogoJpeg from '/Logos/Small logo.jpeg';
import ConvertedHero from '/Logos/converted_1747771169_5314 (1).svg';
import { keyframes } from '@emotion/react';
import { useAuthStore } from '../store/authStore';
import { HomeNavbar } from '../components/HomeNavbar';

// Theme colors from logo
const ACCENT_BLUE = 'brand.700';
const ACCENT_YELLOW = 'yellow.400';
const ACCENT_ORANGE = 'orange.400';
const BG_GRADIENT = 'linear(to-b, #f8fafc 0%, #e0f2fe 100%)';
const CARD_BG = 'white';
const CARD_BORDER = 'gray.200';

// Animation for fade-in
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: none; }
`;
const fadeInSync = `${fadeIn} 1s ease`;

// Brand logo for universal use
function BrandLogo({ size = 36 }: { size?: number }) {
  return (
    <HStack spacing={2}>
      <img 
        src={SmallLogoJpeg} 
        alt="Lazy Uncle Logo" 
        style={{ width: size, height: size }} 
        onError={(e) => {
          console.error('Failed to load logo image');
          e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 36 36'%3E%3Crect width='36' height='36' fill='%23F97316'/%3E%3Ctext x='18' y='24' font-family='Arial' font-size='24' fill='white' text-anchor='middle'%3ELU%3C/text%3E%3C/svg%3E";
        }}
      />
      <Text fontWeight={900} fontSize="xl" letterSpacing={1}>
        <Box as="span" color={ACCENT_ORANGE}>Lazy</Box>
        <Box as="span" color={ACCENT_BLUE}>Uncle</Box>
      </Text>
    </HStack>
  );
}

export default function HomePage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };
  
  // Force any sidebar elements to be hidden
  useEffect(() => {
    // Find and hide any sidebar elements that might be showing
    const sidebarElements = document.querySelectorAll('[data-testid="sidebar"], aside.sidebar, .sidebar');
    sidebarElements.forEach(el => {
      if (el instanceof HTMLElement) {
        el.style.display = 'none';
      }
    });
    
    // Add a class to the body to indicate we're on the homepage
    document.body.classList.add('homepage-view');
    
    return () => {
      document.body.classList.remove('homepage-view');
    };
  }, []);
  
  return (
    // We use position relative and z-index to ensure this container is above any potential sidebar
    <Box 
      position="absolute" 
      top={0} 
      left={0}
      right={0}
      bottom={0}
      zIndex={5}
      bgGradient={BG_GRADIENT} 
      minH="100vh"
      overflowY="auto"
    >
      {/* Add HomeNavbar at the top of the page */}
      <HomeNavbar />
      
      <Container maxW="container.lg" centerContent pt={{ base: 24, md: 32 }}>
        {/* Hero Section */}
        <Flex direction={{ base: 'column', md: 'row' }} align="center" justify="center" py={{ base: 12, md: 24 }} gap={16} w="full">
          <Box
            flexShrink={0}
            display="flex"
            alignItems="center"
            justifyContent="center"
            position="relative"
            mb={{ base: 10, md: 0 }}
          >
            {/* Soft blurred background glow */}
            <Box
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              w={useBreakpointValue({ base: '260px', md: '370px' })}
              h={useBreakpointValue({ base: '260px', md: '370px' })}
              bgGradient="radial(ellipse at center, #e0f2fe 60%, #fff0 100%)"
              filter="blur(32px)"
              zIndex={0}
              borderRadius="full"
            />
            <Box
              bg="whiteAlpha.800"
              borderRadius="2xl"
              boxShadow="lg"
              p={{ base: 4, md: 8 }}
              zIndex={1}
              animation={fadeInSync}
            >
              <img
                src={ConvertedHero}
                alt="Lazy Uncle Hero"
                style={{ width: useBreakpointValue({ base: '220px', md: '320px' }), height: useBreakpointValue({ base: '220px', md: '320px' }) }}
                onError={(e) => {
                  console.error('Failed to load hero image');
                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='320' viewBox='0 0 320 320'%3E%3Crect width='320' height='320' fill='%23F0F9FF'/%3E%3Ctext x='160' y='160' font-family='Arial' font-size='48' fill='%2303449E' text-anchor='middle'%3ELazyUncle%3C/text%3E%3C/svg%3E";
                }}
              />
            </Box>
          </Box>
          <Stack spacing={8} flex={1} maxW="lg" align={{ base: 'center', md: 'flex-start' }} textAlign={{ base: 'center', md: 'left' }}>
            <Heading
              as="h1"
              size={useBreakpointValue({ base: '2xl', md: '3xl' })}
              fontWeight={900}
              lineHeight={1.1}
              letterSpacing={-1}
              mb={2}
              animation={fadeInSync}
            >
              <Box as="span" color={ACCENT_ORANGE}>Gifting</Box>
              <Box as="span" color={ACCENT_BLUE}>, on </Box>
              <Box as="span" color={ACCENT_BLUE}>Autopilot</Box>
              <Box as="span" color={ACCENT_BLUE}>.</Box>
            </Heading>
            <Text
              color="neutral.700"
              fontSize="lg"
              fontWeight={400}
              mb={2}
              animation={fadeInSync}
            >
              Never forget a birthday, anniversary, or special moment again.
            </Text>
            <Stack direction={{ base: 'column', sm: 'row' }} spacing={4} pt={2} justify={{ base: 'center', md: 'flex-start' }}>
              <Button
                onClick={handleGetStarted}
                size="lg"
                colorScheme="orange"
                bg={ACCENT_ORANGE}
                color="white"
                _hover={{ bg: '#ea580c', boxShadow: 'lg', transform: 'scale(1.05)' }}
                fontWeight="bold"
                rounded="full"
                px={8}
                animation={fadeInSync}
              >
                {user ? 'Go to Dashboard' : 'Get Started'}
              </Button>
            </Stack>
          </Stack>
        </Flex>

        {/* Divider between hero and value props */}
        <Box h={{ base: 2, md: 4 }} />

        {/* Why Lazy Uncle Section */}
        <Box w="full" py={16}>
          <Heading as="h3" size="lg" color={ACCENT_BLUE} fontWeight={700} textAlign="center" mb={10} letterSpacing={-0.5}>
            Why LazyUncle?
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10} maxW="900px" mx="auto">
            <ValueProp
              icon={FaRegCalendarCheck}
              text="Never miss a date"
              headline="We remember so you don't have to"
              description="We track birthdays, anniversaries, and more—so you never forget an important moment."
            />
            <ValueProp
              icon={FaGift}
              text="Personalized gift recommendations"
              headline="Gifts they'll actually love"
              description="We learn about your recipients and suggest gifts they'll love, every time."
            />
            <ValueProp
              icon={FaTruck}
              text="Automatic delivery"
              headline="We handle everything"
              description="We handle the shopping, wrapping, and shipping. You get the credit."
            />
          </SimpleGrid>
        </Box>

        {/* Footer */}
        <Box as="footer" w="full" py={8} mt={8} borderTop={`1px solid ${CARD_BORDER}`} textAlign="center" color="gray.400">
          <Text fontSize="sm">&copy; {new Date().getFullYear()} LazyUncle. All rights reserved.</Text>
          <Stack direction="row" spacing={6} justify="center" mt={2}>
            <FooterLink to="/about">About</FooterLink>
            <FooterLink to="/contact">Contact</FooterLink>
            <FooterLink to="/faq">FAQ</FooterLink>
            <FooterLink to="/privacy">Privacy</FooterLink>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}

function ValueProp({ icon, text, headline, description }: { icon: any; text: string; headline: string; description: string }) {
  // Assign specific colors to each icon based on the icon type
  const getIconColor = (iconComponent: any) => {
    if (iconComponent === FaRegCalendarCheck) return ACCENT_BLUE;
    if (iconComponent === FaGift) return ACCENT_ORANGE;
    if (iconComponent === FaTruck) return 'green.500';
    return 'gray.400'; // fallback
  };

  return (
    <Box
      bg="white"
      borderRadius="xl"
      boxShadow="md"
      p={8}
      h="full"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="flex-start"
      transition="box-shadow 0.2s, transform 0.2s"
      _hover={{ boxShadow: 'xl', transform: 'translateY(-4px) scale(1.03)' }}
    >
      <Icon as={icon} w={9} h={9} color={getIconColor(icon)} mb={4} />
      <Text fontWeight={700} color="gray.800" fontSize="lg" mb={1} textAlign="center">{text}</Text>
      <Text fontWeight={500} color="gray.700" fontSize="md" mb={2} textAlign="center">{headline}</Text>
      <Text color="gray.500" fontSize="sm" textAlign="center">{description}</Text>
    </Box>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <RouterLink to={to} style={{ textDecoration: 'none' }}>
      <Text color="gray.400" fontSize="sm" _hover={{ color: ACCENT_BLUE, textDecoration: 'underline' }} transition="color 0.2s">
        {children}
      </Text>
    </RouterLink>
  );
} 