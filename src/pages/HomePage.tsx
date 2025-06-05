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
  HStack,
} from '@chakra-ui/react';
import { FaRegCalendarCheck, FaTruck, FaGift } from 'react-icons/fa';
import SmallLogoJpeg from '/Logos/Small logo.jpeg';
import ConvertedHero from '/Logos/converted_1747771169_5314 (1).svg';
import { keyframes } from '@emotion/react';
import { useAuthStore } from '../store/authStore';
import { HomeNavbar } from '../components/HomeNavbar';

// Theme colors from logo
const ACCENT_BLUE = 'brand.700';
const ACCENT_ORANGE = 'orange.400';
const BG_GRADIENT = 'linear(to-b, #f8fafc 0%, #e0f2fe 100%)';
const CARD_BORDER = 'gray.200';

// Animation for fade-in
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: none; }
`;
const fadeInSync = `${fadeIn} 1s ease`;

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

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
            <ValueProp
              icon={FaRegCalendarCheck}
              headline="Set It & Forget It"
              text="Tell us about your loved ones once"
              description="We remember all their birthdays, anniversaries, and special occasions automatically."
            />
            <ValueProp
              icon={FaGift}
              headline="Smart Recommendations"
              text="Personalized gift suggestions"
              description="Our AI considers their interests, your budget, and the occasion to find perfect gifts."
            />
            <ValueProp
              icon={FaTruck}
              headline="Automatic Delivery"
              text="Gifts arrive on time, every time"
              description="We handle purchasing and delivery so you never miss an important moment."
            />
          </SimpleGrid>
        </Box>

        {/* Call to Action */}
        <Box py={16} textAlign="center">
          <Stack spacing={4} align="center">
            <Heading as="h3" size="lg" color={ACCENT_BLUE} fontWeight={700}>
              Ready to never forget again?
            </Heading>
            <Text color="neutral.700" fontSize="lg" maxW="2xl">
              Join thousands who've automated their gift-giving and strengthened their relationships.
            </Text>
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
            >
              {user ? 'Go to Dashboard' : 'Get Started Now'}
            </Button>
          </Stack>
        </Box>

        {/* Footer */}
        <Box py={8} borderTop="1px" borderColor={CARD_BORDER} w="full">
          <Stack direction={{ base: 'column', md: 'row' }} spacing={8} justify="space-between" align="center">
            <HStack spacing={2}>
              <img 
                src={SmallLogoJpeg} 
                alt="Lazy Uncle Logo" 
                style={{ width: 32, height: 32 }} 
                onError={(e) => {
                  console.error('Failed to load logo image');
                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23F97316'/%3E%3Ctext x='16' y='22' font-family='Arial' font-size='20' fill='white' text-anchor='middle'%3ELU%3C/text%3E%3C/svg%3E";
                }}
              />
              <Text fontWeight={900} fontSize="lg" letterSpacing={1}>
                <Box as="span" color={ACCENT_ORANGE}>Lazy</Box>
                <Box as="span" color={ACCENT_BLUE}>Uncle</Box>
              </Text>
            </HStack>
            <Stack direction={{ base: 'column', md: 'row' }} spacing={4} align="center">
              <FooterLink to="/how-it-works">How It Works</FooterLink>
              <FooterLink to="/login">Sign In</FooterLink>
              <FooterLink to="/register">Sign Up</FooterLink>
            </Stack>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}

function ValueProp({ icon, text, headline, description }: { icon: any; text: string; headline: string; description: string }) {
  
  const getIconColor = (iconComponent: any) => {
    switch (iconComponent) {
      case FaRegCalendarCheck:
        return 'blue.500';
      case FaGift:
        return 'orange.500';
      case FaTruck:
        return 'green.500';
      default:
        return 'gray.500';
    }
  };

  return (
    <Stack align="center" spacing={4} textAlign="center" animation={fadeInSync}>
      <Icon as={icon} w={12} h={12} color={getIconColor(icon)} />
      <Heading as="h4" size="md" color="gray.800" fontWeight={600}>
        {headline}
      </Heading>
      <Text color="gray.600" fontWeight={500}>
        {text}
      </Text>
      <Text color="gray.500" fontSize="sm">
        {description}
      </Text>
    </Stack>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Text
      as={RouterLink}
      to={to}
      color="gray.600"
      _hover={{ color: ACCENT_BLUE, textDecoration: 'underline' }}
      fontSize="sm"
    >
      {children}
    </Text>
  );
} 