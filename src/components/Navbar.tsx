import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
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
  useToast,
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import SmallLogoJpeg from '/Logos/Small logo.jpeg';
import { useAuthStore } from '../store/authStore';
import { useLocation } from 'react-router-dom';

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

export const Navbar: React.FC = () => {
  const { user, signOut } = useAuthStore();
  const bgColor = useColorModeValue('white', 'gray.800');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  // Minimal nav for HomePage/public pages
  const publicLinks = [
    { label: 'Sign In', to: '/login' },
  ];

  const handleSignOut = async () => {
    try {
      console.log('Signing out...');
      await signOut();
      console.log('Signed out successfully');
      
      toast({
        title: "Signed out successfully",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
      
      // Force navigate to home page
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error signing out",
        description: "Please try again",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  // Desktop nav links
  const navLinks = user
    ? (
      <>
        <Button onClick={handleSignOut} variant="outline" colorScheme="blue" w={{ base: 'full', md: 'auto' }}>
          Sign Out
        </Button>
      </>
    )
    : (
      <>
        {publicLinks.map((link) => (
          <Button key={link.to} as={RouterLink} to={link.to} variant="ghost" colorScheme="blue" w={{ base: 'full', md: 'auto' }}>
            {link.label}
          </Button>
        ))}
      </>
    );

  // Mobile nav links (close drawer on click)
  const mobileNavLinks = user
    ? (
      <>
        <Button
          onClick={async () => {
            try {
              await signOut();
              onClose();
              navigate('/', { replace: true });
            } catch (error) {
              console.error('Error signing out:', error);
              toast({
                title: "Error signing out",
                description: "Please try again",
                status: "error",
                duration: 2000,
                isClosable: true,
              });
            }
          }}
          variant="outline"
          colorScheme="blue"
          w="full"
        >
          Sign Out
        </Button>
      </>
    )
    : (
      <>
        {publicLinks.map((link) => (
          <Button
            key={link.to}
            as={RouterLink}
            to={link.to}
            variant="ghost"
            colorScheme="blue"
            w="full"
            onClick={onClose}
          >
            {link.label}
          </Button>
        ))}
      </>
    );

  return (
    <Box as="nav" bg={bgColor} py={2} boxShadow="sm" position="fixed" top="0" left="0" right="0" zIndex="sticky">
      <Container maxW="container.xl">
        <Flex justify="space-between" align="center">
          <Box>
            <RouterLink to={user ? "/dashboard" : "/"}>
              <BrandLogo size={32} />
            </RouterLink>
          </Box>
          {/* Desktop Nav */}
          <HStack spacing={4} display={{ base: 'none', md: 'flex' }}>
            {navLinks}
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
              {mobileNavLinks}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}; 