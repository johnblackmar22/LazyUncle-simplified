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
  Badge,
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
                Never Forget Another Birthday
              </Text>
            </Heading>
            <Text color="gray.500" fontSize="lg">
              LazyUncle is for busy professionals who can barely remember their own schedules, let alone their nephew's birthday. We'll handle the remembering, gift recommendations, and shipping - all you have to do is take the credit. Set it up once, and never hear "Did you forget my birthday, Uncle?" again.
            </Text>
            <Box>
              <Badge colorScheme="green" fontSize="md" px={2} py={1} borderRadius="md">
                Starting at $9.99/month
              </Badge>
            </Box>
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
                Start Your Free Trial
              </Button>
              <Button
                as={RouterLink}
                to="/subscription-plans"
                rounded="full"
                size="lg"
                fontWeight="normal"
                px={6}
                colorScheme="green"
              >
                View Plans
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
            How It Works
          </Heading>
          
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
            <Feature
              icon="👥"
              title="Add Your Nephews & Nieces"
              text="Enter their details, preferences, and birthdays just once - we'll handle the rest."
            />
            <Feature
              icon="🎁"
              title="Smart Gift Recommendations"
              text="We'll suggest age-appropriate gifts they'll actually love, based on their interests."
            />
            <Feature
              icon="📦"
              title="Automatic Delivery"
              text="Perfect gifts arrive right on time, every time. Be the cool uncle without even trying."
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