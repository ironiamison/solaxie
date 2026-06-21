import { useState } from "react";
import {
  Button,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import AxolCard from "@/components/AxolCard";
import type { GameApi } from "./types";

export default function BreedModal({
  game,
  isOpen,
  onClose,
}: {
  game: GameApi;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [pick, setPick] = useState<number[]>([]);

  const toggle = (id: number) =>
    setPick((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });

  const onBreed = async () => {
    if (pick.length !== 2) return;
    await game.breed(pick[0], pick[1]);
    setPick([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" isCentered scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(6px)" bg="blackAlpha.700" />
      <ModalContent bg="ink.800" borderWidth="1px" borderColor="whiteAlpha.200" color="white">
        <ModalHeader fontFamily="'Baloo 2', sans-serif">🥚 Nursery — Breed Axols</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text color="whiteAlpha.700" fontSize="sm" mb={4}>
            Select two parents. The child inherits genes from both — cost scales with how often
            the parents have bred.
          </Text>
          {game.myAxols.length < 2 ? (
            <Text color="whiteAlpha.600">You need at least 2 Axols to breed.</Text>
          ) : (
            <Wrap spacing={3} justify="center">
              {game.myAxols.map((a) => (
                <WrapItem key={a.id}>
                  <AxolCard
                    axol={a}
                    selected={pick.includes(a.id)}
                    onClick={() => toggle(a.id)}
                    badge={pick.includes(a.id) ? "parent" : undefined}
                  />
                </WrapItem>
              ))}
            </Wrap>
          )}
        </ModalBody>
        <ModalFooter>
          <HStack>
            <Button variant="ghost" onClick={onClose} color="whiteAlpha.700">
              Cancel
            </Button>
            <Button variant="neonPink" isLoading={game.busy === "breed"} isDisabled={pick.length !== 2} onClick={onBreed}>
              Breed ({pick.length}/2)
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
