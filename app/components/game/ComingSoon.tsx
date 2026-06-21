import { Box, Heading, Image, Text, VStack } from "@chakra-ui/react";

export default function ComingSoon({
  title,
  subtitle,
  sprite,
  bg,
}: {
  title: string;
  subtitle: string;
  sprite: string;
  bg?: string;
}) {
  return (
    <Box position="relative" minH="100vh" overflow="hidden">
      <Box position="absolute" inset={0} bgImage={`url(${bg ?? "/profile-bg.png"})`} bgSize="cover" bgPosition="center" />
      <Box position="absolute" inset={0} bgGradient="linear(to-b, rgba(8,5,20,0.7), rgba(8,5,20,0.9))" />
      <VStack position="relative" zIndex={1} minH="100vh" justify="center" spacing={4} px={4} textAlign="center">
        <Image src={sprite} boxSize="150px" objectFit="contain" filter="drop-shadow(0 10px 16px rgba(0,0,0,0.5))" />
        <Heading size="xl" bgGradient="linear(to-r, #b388ff, #ff6fd8)" bgClip="text">
          {title}
        </Heading>
        <Text color="whiteAlpha.700" maxW="440px">
          {subtitle}
        </Text>
        <Box bg="rgba(138,55,255,0.18)" borderWidth="1px" borderColor="brand.400" borderRadius="full" px={4} py={1}>
          <Text fontSize="sm" fontWeight="700" color="brand.200">
            Coming soon
          </Text>
        </Box>
      </VStack>
    </Box>
  );
}
