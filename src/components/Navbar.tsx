import React, { useState } from 'react';
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
import SmallLogoJpeg from '../../Logos/Small logo.jpeg';
import { useAuthStore } from '../store/authStore';

// Theme colors from logo
const ACCENT_BLUE = 'brand.700';
const ACCENT_ORANGE = 'orange.400';

function BrandLogo({ size = 36 }: { size?: number }) {
  return (
    <HStack spacing={2}>
      <img src={SmallLogoJpeg} alt="Lazy Uncle Logo" style={{ width: size, height: size }} />
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

  // Nav links for reuse
  const navLinks = user ? (
    <>
      <Button as={RouterLink} to="/dashboard" variant="ghost" colorScheme="blue" w={{ base: 'full', md: 'auto' }}>
        Dashboard
      </Button>
      <Button as={RouterLink} to="/settings" variant="ghost" colorScheme="blue" w={{ base: 'full', md: 'auto' }}>
        Settings
      </Button>
      <Button onClick={async () => { await signOut(); }} variant="outline" colorScheme="blue" w={{ base: 'full', md: 'auto' }}>
        Sign Out
      </Button>
    </>
  ) : (
    <>
      <Button as={RouterLink} to="/login" variant="ghost" colorScheme="blue" w={{ base: 'full', md: 'auto' }}>
        Sign In
      </Button>
      <Button as={RouterLink} to="/register" colorScheme="blue" w={{ base: 'full', md: 'auto' }}>
        Register
      </Button>
    </>
  );

  return (
    <Box as="nav" bg={bgColor} py={4} boxShadow="sm">
      <Container maxW="container.xl">
        <Flex justify="space-between" align="center">
          <Box>
            <RouterLink to="/">
              <BrandLogo size={36} />
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
              {navLinks}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}; 