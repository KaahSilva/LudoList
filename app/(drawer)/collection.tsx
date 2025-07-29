"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, FlatList } from "react-native"
import { Text, Button } from "react-native-paper"
import { supabase } from "../../lib/supabase"
import { useAuth } from "../_layout"
import { useRouter } from "expo-router"
import GameCard from "../../app/components/GameCard"

interface GameInList {
  game_id: number
  added_at: string
  games: {
    id: number
    name: string
    thumbnail_url: string
    description: string
    min_players: number
    max_players: number
    playing_time: number
  } | null
}

export default function CollectionScreen() {
  const [games, setGames] = useState<GameInList[]>([])
  const [loading, setLoading] = useState(true)
  const { profile } = useAuth()
  const router = useRouter()

  const fetchCollection = async () => {
    if (!profile) return

    try {
      const { data, error } = await supabase
        .from("user_game_lists")
        .select(`
        game_id,
        added_at,
        games (
          id,
          name,
          thumbnail_url,
          description,
          min_players,
          max_players,
          playing_time
        )
      `)
        .eq("user_id", profile.id)
        .eq("list_type", "collection")
        .order("added_at", { ascending: false })

      if (error) {
        console.error("Erro ao buscar coleção:", error)
        return
      }

      const transformedGames: GameInList[] = (data || [])
        .map((item: any) => ({
          game_id: item.game_id,
          added_at: item.added_at,
          games: Array.isArray(item.games) && item.games.length > 0 ? item.games[0] : item.games || null,
        }))
        .filter((item) => item.games !== null)

      setGames(transformedGames)
    } catch (error) {
      console.error("Erro inesperado:", error)
    } finally {
      setLoading(false)
    }
  }

  const removeFromCollection = async (gameId: number) => {
    if (!profile) return

    try {
      const { error } = await supabase
        .from("user_game_lists")
        .delete()
        .eq("user_id", profile.id)
        .eq("game_id", gameId)
        .eq("list_type", "collection")

      if (error) {
        console.error("Erro ao remover da coleção:", error)
        return
      }

      setGames((prev) => prev.filter((item) => item.game_id !== gameId))
    } catch (error) {
      console.error("Erro inesperado:", error)
    }
  }

  const renderGame = ({ item }: { item: GameInList }) => {
    if (!item.games) return null

    return (
      <GameCard
        game={item.games}
        showDate={true}
        dateText={`Adicionado em ${new Date(item.added_at).toLocaleDateString("pt-BR")}`}
        showRemoveButton={true}
        onRemove={() => removeFromCollection(item.game_id)}
        removeButtonText="Remover da Coleção"
        mainButtonText="Ver Detalhes"
      />
    )
  }

  useEffect(() => {
    fetchCollection()
  }, [profile])

  if (games.length === 0 && !loading) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="headlineSmall" style={styles.emptyTitle}>
          Sua coleção está vazia
        </Text>
        <Text variant="bodyMedium" style={styles.emptyText}>
          Comece adicionando jogos que você possui!
        </Text>
        <Button mode="contained" onPress={() => router.push("/(drawer)/feed")} style={styles.searchButton}>
          Ver Jogos
        </Button>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={games}
        renderItem={renderGame}
        keyExtractor={(item) => item.game_id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    textAlign: "center",
    marginBottom: 16,
  },
  emptyText: {
    textAlign: "center",
    opacity: 0.7,
    marginBottom: 24,
  },
  searchButton: {
    paddingHorizontal: 24,
  },
})
