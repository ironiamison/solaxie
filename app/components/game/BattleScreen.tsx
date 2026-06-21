import { useState } from "react";
import { Box, Button, Flex, Heading, Image, Text, VStack, Wrap, WrapItem } from "@chakra-ui/react";
import AxolCard from "@/components/AxolCard";
import type { GameApi } from "./types";

export default function BattleScreen({ game }: { game: GameApi }) {
  const { myAxols, allAxols } = game;
  const [mine, setMine] = useState<number | null>(game.selectedId);
  const [opp, setOpp] = useState<number | null>(null);

  const opponents = allAxols.filter((a) => a.id !== mine);

  return (
    <Box position="relative" minH="100vh" overflow="hidden">
      <Box position="absolute" inset={0} bgImage="url(/arena.png)" bgSize="cover" bgPosition="center" />
      <Box position="absolute" inset={0} bgGradient="linear(to-b, rgba(8,5,20,0.6), rgba(8,5,20,0.85))" />

      <Box position="relative" zIndex={1} maxW="1180px" mx="auto" px={4} pt="72px" pb="110px">
        <VStack mb={6} spacing={1}>
          <Heading size="lg" bgGradient="linear(to-r, #ff6b6b, #ffb02e)" bgClip="text">
            Battle Arena
          </Heading>
          <Text color="whiteAlpha.700" fontSize="sm">
            Pick your fighter and an opponent. Winners earn DNA + XP · costs 5 energy.
          </Text>
        </VStack>

        {myAxols.length === 0 ? (
          <Text textAlign="center" color="whiteAlpha.700">
            You need an Axol first — roll one from the DNA Shrine.
          </Text>
        ) : (
          <Flex direction={{ base: "column", lg: "row" }} gap={6} align="start" justify="center">
            <Box flex={1}>
              <Text fontWeight="800" color="white" mb={2}>
                Your fighter
              </Text>
              <Wrap spacing={3}>
                {myAxols.map((a) => (
                  <WrapItem key={a.id}>
                    <AxolCard axol={a} selected={mine === a.id} onClick={() => setMine(a.id)} />
                  </WrapItem>
                ))}
              </Wrap>
            </Box>

            <VStack alignSelf="center" minW="120px" py={6}>
              <Image src="/sprites/beast.png" boxSize="60px" opacity={0.5} alt="" />
              <Text fontFamily="'Baloo 2', sans-serif" fontWeight="800" fontSize="2xl" color="whiteAlpha.500">
                VS
              </Text>
            </VStack>

            <Box flex={1}>
              <Text fontWeight="800" color="white" mb={2}>
                Opponent
              </Text>
              <Wrap spacing={3}>
                {opponents.map((a) => (
                  <WrapItem key={a.id}>
                    <AxolCard axol={a} selected={opp === a.id} onClick={() => setOpp(a.id)} />
                  </WrapItem>
                ))}
              </Wrap>
            </Box>
          </Flex>
        )}

        <Flex justify="center" mt={8}>
          <Button
            variant="neonRed"
            size="lg"
            px={12}
            isLoading={game.busy === "battle"}
            isDisabled={mine === null || opp === null}
            onClick={() => mine !== null && opp !== null && game.battle(mine, opp)}
          >
            ⚔️ Fight!
          </Button>
        </Flex>
      </Box>
    </Box>
  );
}
