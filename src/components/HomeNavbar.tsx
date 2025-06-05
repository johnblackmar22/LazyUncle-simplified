import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Flex,
  HStack,
  Button,
  IconButton,
  useColorModeValue,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  VStack,
  useDisclosure,
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import SmallLogoJpeg from '/Logos/Small logo.jpeg';
import { useAuthStore } from '../store/authStore';

// Theme colors from logo
const ACCENT_BLUE = 'brand.700';
const ACCENT_ORANGE = 'orange.400';

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
      <Box as="span" fontWeight={900} fontSize="xl" letterSpacing={1}>
        <Box as="span" color={ACCENT_ORANGE}>Lazy</Box>
        <Box as="span" color={ACCENT_BLUE}>Uncle</Box>
      </Box>
    </HStack>
  );
}

export const HomeNavbar: React.FC = () => {
  const { user } = useAuthStore();
  const bgColor = useColorModeValue('white', 'gray.800');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [scrolled, setScrolled] = useState(false);

  // Add scroll listener to add shadow on scroll
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Call-to-action buttons based on auth state
  const ctaButton = user 
    ? { label: 'Go to App', to: '/dashboard' }
    : { label: 'Get Started', to: '/register' };

  // Secondary button based on auth state
  const secondaryButton = user
    ? null  // No secondary button needed when logged in
    : { label: 'Login', to: '/login' };

  return (
    <Box 
      as="nav" 
      bg={bgColor} 
      py={4} 
      position="fixed" 
      top={0} 
      left={0} 
      right={0} 
      zIndex={10}
      transition="all 0.3s ease"
      boxShadow={scrolled ? "md" : "sm"}
    >
      <Container maxW="container.xl">
        <Flex justify="space-between" align="center">
          <Box>
            <RouterLink to="/">
              <BrandLogo size={36} />
            </RouterLink>
          </Box>
          {/* Desktop Nav */}
          <HStack spacing={4} display={{ base: 'none', md: 'flex' }}>
            <Button as={RouterLink} to={ctaButton.to} colorScheme="orange" size="md">
              {ctaButton.label}
            </Button>
            {secondaryButton && (
              <Button as={RouterLink} to={secondaryButton.to} variant="outline" colorScheme="blue" size="md">
                {secondaryButton.label}
              </Button>
            )}
          </HStack>
          {/* Mobile Hamburger */}
          <IconButton
            aria-label="Open menu"
            icon={<HamburgerIcon />}
            display={{ base: 'flex', md: 'none' }}
            onClick={onOpen}
            variant="ghost"
            size="lg"
          />
        </Flex>
      </Container>
      {/* Mobile Drawer */}
      <Drawer placement="right" onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Menu</DrawerHeader>
          <DrawerBody>
            <VStack spacing={4} align="stretch">
              {/* Mobile nav links (close drawer on click) */}
              <Button
                as={RouterLink}
                to={ctaButton.to}
                colorScheme="orange"
                w="full"
                onClick={onClose}
              >
                {ctaButton.label}
              </Button>
              {secondaryButton && (
                <Button
                  as={RouterLink}
                  to={secondaryButton.to}
                  variant="outline"
                  colorScheme="blue"
                  w="full"
                  onClick={onClose}
                >
                  {secondaryButton.label}
                </Button>
              )}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}; 