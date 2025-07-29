"use client"

import { View, StyleSheet, Image } from "react-native"
import { Card, Text, Button, Chip } from "react-native-paper"
import { useRouter } from "expo-router"

interface Game {
  id: number
  name: string
  thumbnail_url: string
  description: string
  min_players: number
  max_players: number
  playing_time: number
}

interface GameCardProps {
  game: Game
  showDate?: boolean
  dateText?: string
  showRemoveButton?: boolean
  onRemove?: () => void
  removeButtonText?: string
  extraButtons?: Array<{
    text: string
    mode?: "text" | "outlined" | "contained"
    onPress: () => void
    textColor?: string
  }>
  mainButtonText?: string
}

export default function GameCard({
  game,
  showDate = false,
  dateText,
  showRemoveButton = false,
  onRemove,
  removeButtonText = "Remover",
  extraButtons = [],
  mainButtonText = "Ver Detalhes e Avaliar",
}: GameCardProps) {
  const router = useRouter()

  return (
    <Card style={styles.card}>
      <Card.Content>
        
        {showDate && dateText && (
          <View style={styles.gameHeader}>
            <Text variant="bodySmall" style={styles.date}>
              {dateText}
            </Text>
          </View>
        )}

        <View style={styles.gameSection}>
          <View style={styles.gameMainInfo}>
            
            {game.thumbnail_url ? (
              <Image source={{ uri: game.thumbnail_url }} style={styles.gameImage} resizeMode="cover" />
            ) : (
              <Image source={require("../../app/assets/ludoimg.png")} style={styles.gameImage} resizeMode="contain" />
            )}

            <View style={styles.gameDetails}>
              <Text
                variant="titleLarge"
                style={styles.gameTitle}
                onPress={() => router.push(`/(drawer)/game/${game.id}`)}
              >
                {game.name}
              </Text>

              <View style={styles.gameInfo}>
                <Chip icon="account-group" compact style={styles.chip}>
                  {game.min_players}-{game.max_players} jogadores
                </Chip>
                <Chip icon="clock" compact style={styles.chip}>
                  {game.playing_time} min
                </Chip>
              </View>

              {game.description && (
                <Text variant="bodyMedium" style={styles.description} numberOfLines={3}>
                  {game.description}
                </Text>
              )}
            </View>
          </View>

         
          {extraButtons.length > 0 && (
            <View style={styles.extraButtons}>
              {extraButtons.map((button, index) => (
                <Button
                  key={index}
                  mode={button.mode || "outlined"}
                  compact
                  onPress={button.onPress}
                  textColor={button.textColor}
                  style={styles.extraButton}
                >
                  {button.text}
                </Button>
              ))}
            </View>
          )}

        
          <Button
            mode="contained"
            onPress={() => router.push(`/(drawer)/game/${game.id}`)}
            style={styles.detailsButton}
          >
            {mainButtonText}
          </Button>

          {showRemoveButton && onRemove && (
            <Button mode="text" textColor="#d32f2f" onPress={onRemove} style={styles.removeButton}>
              {removeButtonText}
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  gameHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 12,
  },
  date: {
    opacity: 0.7,
  },
  gameSection: {
    marginBottom: 12,
  },
  gameMainInfo: {
    flexDirection: "row",
    marginBottom: 12,
  },
  gameImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#f0f0f0",
  },
  gameDetails: {
    flex: 1,
  },
  gameTitle: {
    fontWeight: "bold",
    color: "#6200ee",
    marginBottom: 8,
  },
  gameInfo: {
    flexDirection: "row",
    marginBottom: 8,
  },
  chip: {
    marginRight: 8,
  },
  description: {
    opacity: 0.7,
    lineHeight: 18,
  },
  extraButtons: {
    flexDirection: "row",
    marginBottom: 12,
    flexWrap: "wrap",
  },
  extraButton: {
    marginRight: 8,
    marginBottom: 4,
  },
  detailsButton: {
    alignSelf: "center",
    marginBottom: 8,
  },
  removeButton: {
    alignSelf: "center",
  },
})
