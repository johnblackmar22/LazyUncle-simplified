import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Stack,
  Text,
  useColorModeValue,
  SimpleGrid,
  Icon,
} from '@chakra-ui/react';

export default function HomePage() {
  const bgGradient = useColorModeValue(
    'linear(to-b, white, gray.50)',
    'linear(to-b, gray.900, gray.800)'
  );

  return (
    <Box bgGradient={bgGradient} minH="100vh" pt={10}>
      <Container maxW="container.xl">
        <Stack
          align="center"
          spacing={{ base: 8, md: 10 }}
          direction={{ base: 'column', md: 'row' }}
          py={{ base: 10, md: 20 }}
        >
          <Stack flex={1} spacing={{ base: 5, md: 10 }}>
            <Heading
              lineHeight={1.1}
              fontWeight={600}
              fontSize={{ base: '3xl', sm: '4xl', lg: '6xl' }}
            >
              <Text
                as="span"
                position="relative"
                color="brand.500"
              >
                LazyUncle
              </Text>
              <br />
              <Text as="span" fontSize={{ base: '2xl', sm: '3xl', lg: '4xl' }}>
                Never Forget a Gift Again
              </Text>
            </Heading>
            <Text color="gray.500" fontSize="lg">
              LazyUncle helps you manage gifts for all your important people.
              Keep track of recipients, important dates, and gift ideas. No more
              last-minute shopping or forgotten birthdays!
            </Text>
            <Stack
              spacing={{ base: 4, sm: 6 }}
              direction={{ base: 'column', sm: 'row' }}
            >
              <Button
                as={RouterLink}
                to="/register"
                rounded="full"
                size="lg"
                fontWeight="normal"
                px={6}
                colorScheme="blue"
                bg="brand.500"
                _hover={{ bg: 'brand.600' }}
              >
                Get Started
              </Button>
              <Button
                as={RouterLink}
                to="/login"
                rounded="full"
                size="lg"
                fontWeight="normal"
                px={6}
                variant="outline"
              >
                Sign In
              </Button>
            </Stack>
          </Stack>
          <Flex
            flex={1}
            justify="center"
            align="center"
            position="relative"
            w="full"
          >
            <Box
              position="relative"
              height="300px"
              rounded="2xl"
              boxShadow="2xl"
              width="full"
              overflow="hidden"
              display="flex"
              alignItems="center"
              justifyContent="center"
              bg="gray.100"
            >
              <Text fontSize="8xl">🎁</Text>
            </Box>
          </Flex>
        </Stack>

        <Stack spacing={12} mb={20}>
          <Heading as="h2" textAlign="center" size="xl">
            Features
          </Heading>
          
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
            <Feature
              icon="👥"
              title="Manage Recipients"
              text="Keep track of all your gift recipients in one place with important details like interests and relationships."
            />
            <Feature
              icon="🎁"
              title="Track Gifts"
              text="Record gifts you've given or plan to give, including price, occasion, and delivery status."
            />
            <Feature
              icon="📅"
              title="Important Dates"
              text="Never miss an important occasion with reminders for birthdays, anniversaries, and holidays."
            />
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
}

interface FeatureProps {
  title: string;
  text: string;
  icon: string;
}

function Feature({ title, text, icon }: FeatureProps) {
  return (
    <Stack align="center" textAlign="center">
      <Flex
        w={16}
        h={16}
        align="center"
        justify="center"
        rounded="full"
        bg="brand.500"
        mb={1}
      >
        <Text fontSize="2xl" color="white">{icon}</Text>
      </Flex>
      <Text fontWeight={600} fontSize="lg">{title}</Text>
      <Text color="gray.600">{text}</Text>
    </Stack>
  );
} 