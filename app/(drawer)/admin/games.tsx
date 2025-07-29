"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, FlatList } from "react-native"
import { Card, Text, Button, FAB, IconButton, Dialog, Portal } from "react-native-paper"
import { supabase } from "../../../lib/supabase"
import { useRouter } from "expo-router"
import { useFocusEffect } from "@react-navigation/native"
import { useCallback } from "react"

interface Game {
  id: number
  name: string
  thumbnail_url: string
  description: string
  min_players: number
  max_players: number
  playing_time: number
}

export default function AdminGamesScreen() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState<{ visible: boolean; game: Game | null }>({
    visible: false,
    game: null,
  })
  const router = useRouter()

  const fetchGames = async () => {
    try {
      const { data, error } = await supabase.from("games").select("*").order("name")
      if (error) {
        console.error("Erro ao buscar jogos:", error)
        return
      }
      setGames(data || [])
    } catch (error) {
      console.error("Erro inesperado:", error)
    } finally {
      setLoading(false)
    }
  }

  const deleteGame = async (gameId: number) => {
    try {
  
      const { error } = await supabase.from("games").delete().eq("id", gameId)

      if (error) {
        console.error("Erro ao deletar jogo:", error)
        return
      }

      console.log(`Jogo ${gameId} deletado com sucesso (incluindo todos os dados relacionados)`)
      setGames((prev) => prev.filter((game) => game.id !== gameId))
      setDeleteDialog({ visible: false, game: null })
    } catch (error) {
      console.error("Erro inesperado:", error)
    }
  }

  const renderGame = ({ item }: { item: Game }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.gameInfo}>
            <Text variant="titleMedium" style={styles.gameTitle}>
              {item.name}
            </Text>
            <Text variant="bodySmall">
              {item.min_players}-{item.max_players} jogadores • {item.playing_time} min
            </Text>
          </View>
          <View style={styles.actions}>
            <IconButton icon="pencil" onPress={() => router.push(`/(drawer)/admin/edit-game/${item.id}`)} />
            <IconButton icon="delete" onPress={() => setDeleteDialog({ visible: true, game: item })} />
          </View>
        </View>
        {item.description && (
          <Text variant="bodySmall" style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </Card.Content>
    </Card>
  )

 
  useFocusEffect(
    useCallback(() => {
     
      const timer = setTimeout(() => {
        fetchGames()
      }, 300)

      return () => clearTimeout(timer)
    }, []),
  )

  useEffect(() => {
    fetchGames()
  }, [])

  return (
    <View style={styles.container}>
      <FlatList
        data={games}
        renderItem={renderGame}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      <FAB icon="plus" style={styles.fab} onPress={() => router.push("/(drawer)/admin/add-game")} />

      <Portal>
        <Dialog visible={deleteDialog.visible} onDismiss={() => setDeleteDialog({ visible: false, game: null })}>
          <Dialog.Title>Confirmar Exclusão</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">Tem certeza que deseja excluir o jogo "{deleteDialog.game?.name}"?</Text>
            <Text variant="bodySmall" style={styles.warningText}>
               Isso também deletará TODAS as avaliações e listas de usuários relacionadas a este jogo. Esta ação não
              pode ser desfeita.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialog({ visible: false, game: null })}>Cancelar</Button>
            <Button onPress={() => deleteDialog.game && deleteGame(deleteDialog.game.id)} textColor="#d32f2f">
              Excluir Tudo
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  listContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  gameInfo: {
    flex: 1,
  },
  gameTitle: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  actions: {
    flexDirection: "row",
  },
  description: {
    marginTop: 8,
    opacity: 0.7,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
  warningText: {
    marginTop: 8,
    color: "#d32f2f",
    fontStyle: "italic",
  },
})
