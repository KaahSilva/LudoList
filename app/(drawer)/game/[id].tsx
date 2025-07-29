"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, Image } from "react-native"
import { Card, Text, Button, Chip, TextInput, Avatar, Divider, IconButton } from "react-native-paper"
import { useLocalSearchParams, useRouter } from "expo-router"
import { supabase } from "../../../lib/supabase"
import { useAuth } from "../../_layout"
import { Star, Edit, Heart, Package, CheckCircle } from "lucide-react-native"

interface Game {
  id: number
  name: string
  thumbnail_url: string
  description: string
  min_players: number
  max_players: number
  playing_time: number
}

interface Evaluation {
  id: string
  rating: number
  comment: string
  created_at: string
  user_id: string
  game_id: number
  profiles: {
    username: string
    first_name: string
    last_name: string
  }
}

interface UserGameStatus {
  collection: boolean
  wishlist: boolean
  played: boolean
}

export default function GameDetailScreen() {
  const { id } = useLocalSearchParams()
  const [game, setGame] = useState<Game | null>(null)
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [userEvaluation, setUserEvaluation] = useState<Evaluation | null>(null)
  const [userGameStatus, setUserGameStatus] = useState<UserGameStatus>({
    collection: false,
    wishlist: false,
    played: false,
  })
  const [newRating, setNewRating] = useState(0)
  const [newComment, setNewComment] = useState("")
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [imageError, setImageError] = useState(false)
  const { profile, isAdmin } = useAuth()
  const router = useRouter()

  const fetchGameDetails = async () => {
    try {
      console.log("Buscando detalhes do jogo ID:", id)

      // Buscar dados do jogo
      const { data: gameData, error: gameError } = await supabase.from("games").select("*").eq("id", id).single()
      if (gameError) {
        console.error("Erro ao buscar jogo:", gameError)
        return
      }
      console.log("Jogo encontrado:", gameData)
      setGame(gameData)

      
      if (profile) {
        const { data: userListsData, error: userListsError } = await supabase
          .from("user_game_lists")
          .select("list_type")
          .eq("user_id", profile.id)
          .eq("game_id", id)

        if (!userListsError && userListsData) {
          const status: UserGameStatus = {
            collection: false,
            wishlist: false,
            played: false,
          }
          userListsData.forEach((item) => {
            if (item.list_type === "collection") status.collection = true
            if (item.list_type === "wishlist") status.wishlist = true
            if (item.list_type === "played") status.played = true
          })
          setUserGameStatus(status)
        }
      }


      console.log("Buscando avaliações para o jogo ID:", id)
      const { data: evaluationsData, error: evaluationsError } = await supabase
        .from("evaluations")
        .select(`
          *,
          profiles!evaluations_user_id_fkey (username, first_name, last_name)
        `)
        .eq("game_id", Number(id)) 
        .order("created_at", { ascending: false })

      if (evaluationsError) {
        console.error("Erro ao buscar avaliações:", evaluationsError)
        return
      }

      console.log("Avaliações encontradas:", evaluationsData)
      console.log(" Total de avaliações:", evaluationsData?.length || 0)

      // Filtrar avaliações do usuário atual vs outros usuários
      const userEval = evaluationsData?.find((evaluation) => evaluation.user_id === profile?.id)
      const otherEvals = evaluationsData?.filter((evaluation) => evaluation.user_id !== profile?.id) || []

      console.log("Avaliação do usuário:", userEval)
      console.log(" Avaliações de outros:", otherEvals.length)

      setUserEvaluation(userEval || null)
      setEvaluations(otherEvals)

 
      if (userEval) {
        console.log(" Carregando avaliação existente do usuário")
        setNewRating(userEval.rating)
        setNewComment(userEval.comment || "")
        if (userEval.comment) {
          setShowCommentInput(true)
        }
      } else {
        console.log(" Nenhuma avaliação do usuário - campos limpos")
        setNewRating(0)
        setNewComment("")
        setShowCommentInput(false)
      }
    } catch (error) {
      console.error("Erro inesperado:", error)
    } finally {
      setLoading(false)
    }
  }

  const submitEvaluation = async () => {
    if (!profile || newRating === 0) return

    setSubmitting(true)
    try {
      console.log(" Salvando avaliação:", {
        user_id: profile.id,
        game_id: Number(id),
        rating: newRating,
        comment: newComment.trim() || null,
      })

      const evaluationData = {
        user_id: profile.id,
        game_id: Number(id),
        rating: newRating,
        comment: newComment.trim() || null,
      }

      if (userEvaluation) {
        // Atualizar avaliação existente
        const { error } = await supabase.from("evaluations").update(evaluationData).eq("id", userEvaluation.id)
        if (error) {
          console.error("Erro ao atualizar avaliação:", error)
          return
        }
        console.log(" Avaliação atualizada com sucesso")
      } else {
       
        const { error } = await supabase.from("evaluations").upsert(evaluationData, {
          onConflict: "user_id,game_id",
          ignoreDuplicates: false,
        })
        if (error) {
          console.error("Erro ao criar avaliação:", error)
          return
        }
        console.log(" Nova avaliação criada com sucesso")
      }

      fetchGameDetails()
    } catch (error) {
      console.error("Erro inesperado:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const deleteEvaluation = async (evaluationId: string) => {
    try {
      const { error } = await supabase.from("evaluations").delete().eq("id", evaluationId)
      if (error) {
        console.error("Erro ao deletar avaliação:", error)
        return
      }
      fetchGameDetails()
    } catch (error) {
      console.error("Erro inesperado:", error)
    }
  }

  const renderStars = (rating: number, interactive = false) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={interactive ? 24 : 16}
        color={index < rating ? "#FFD700" : "#E0E0E0"}
        fill={index < rating ? "#FFD700" : "transparent"}
        onPress={interactive ? () => setNewRating(index + 1) : undefined}
      />
    ))
  }

  const addToList = async (gameId: number, listType: "collection" | "wishlist" | "played") => {
    if (!profile) return

    try {
      // Verificar se já está na lista
      const { data: existingData, error: checkError } = await supabase
        .from("user_game_lists")
        .select("*")
        .eq("user_id", profile.id)
        .eq("game_id", gameId)
        .eq("list_type", listType)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        console.error("Erro ao verificar lista:", checkError)
        return
      }

      const isCurrentlyInList = !!existingData

      if (isCurrentlyInList) {
     
        const { error } = await supabase
          .from("user_game_lists")
          .delete()
          .eq("user_id", profile.id)
          .eq("game_id", gameId)
          .eq("list_type", listType)

        if (error) {
          console.error("Erro ao remover da lista:", error)
          return
        }
      } else {
       
        if (listType === "collection") {
          await supabase
            .from("user_game_lists")
            .delete()
            .eq("user_id", profile.id)
            .eq("game_id", gameId)
            .eq("list_type", "wishlist")
        }

        const { error } = await supabase.from("user_game_lists").insert({
          user_id: profile.id,
          game_id: gameId,
          list_type: listType,
        })

        if (error) {
          console.error("Erro ao adicionar à lista:", error)
          return
        }
      }

    
      fetchGameDetails()
    } catch (error) {
      console.error("Erro ao adicionar/remover da lista:", error)
    }
  }

  const handleImageError = () => {
    setImageError(true)
  }

 
  useEffect(() => {
    console.log(" ID do jogo mudou para:", id)
    setGame(null)
    setEvaluations([])
    setUserEvaluation(null)
    setNewRating(0)
    setNewComment("")
    setShowCommentInput(false)
    setUserGameStatus({ collection: false, wishlist: false, played: false })
    setLoading(true)

    if (id) {
      fetchGameDetails()
    }
  }, [id, profile])

  if (loading || !game) {
    return (
      <View style={styles.container}>
        <Text>Carregando...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Card.Content style={styles.gameContent}>
     
          <Text variant="headlineMedium" style={styles.gameTitle}>
            {game.name}
          </Text>

        
          <View style={styles.imageContainer}>
            {game.thumbnail_url && !imageError ? (
              <Image
                source={{ uri: game.thumbnail_url }}
                style={styles.gameImage}
                resizeMode="cover"
                onError={handleImageError}
              />
            ) : (
              <Image source={require("../../assets/ludoimg.png")} style={styles.gameImage} resizeMode="contain" />
            )}
          </View>

          {/* Informações do jogo */}
          <View style={styles.gameInfoContainer}>
            <View style={styles.gameStats}>
              <Chip icon="account-group" style={styles.chip}>
                {game.min_players}-{game.max_players} jogadores
              </Chip>
              <Chip icon="clock" style={styles.chip}>
                {game.playing_time} min
              </Chip>
            </View>
            {game.description && (
              <Text variant="bodyMedium" style={styles.description}>
                {game.description}
              </Text>
            )}
          </View>

          {/* Ações do usuário */}
          <View style={styles.userActions}>
            <Text variant="titleMedium" style={styles.actionsTitle}>
              Adicionar às suas listas:
            </Text>
            <View style={styles.actionButtons}>
              <Button
                mode={userGameStatus.collection ? "contained" : "outlined"}
                onPress={() => addToList(game.id, "collection")}
                style={[styles.actionButton, userGameStatus.collection && styles.selectedButton]}
                labelStyle={[styles.buttonLabel, userGameStatus.collection && styles.selectedButtonLabel]}
                icon={() => <Package size={20} color={userGameStatus.collection ? "white" : "#6200ee"} />}
              >
                Tenho
              </Button>
              <Button
                mode={userGameStatus.wishlist ? "contained" : "outlined"}
                onPress={() => addToList(game.id, "wishlist")}
                style={[styles.actionButton, userGameStatus.wishlist && styles.selectedButton]}
                labelStyle={[styles.buttonLabel, userGameStatus.wishlist && styles.selectedButtonLabel]}
                icon={() => <Heart size={20} color={userGameStatus.wishlist ? "white" : "#6200ee"} />}
              >
                Quero
              </Button>
              <Button
                mode={userGameStatus.played ? "contained" : "outlined"}
                onPress={() => addToList(game.id, "played")}
                style={[styles.actionButton, userGameStatus.played && styles.selectedButton]}
                labelStyle={[styles.buttonLabel, userGameStatus.played && styles.selectedButtonLabel]}
                icon={() => <CheckCircle size={20} color={userGameStatus.played ? "white" : "#6200ee"} />}
              >
                Joguei
              </Button>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Seção de Avaliação do Usuário */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            {userEvaluation ? "Sua Avaliação" : "Avaliar Jogo"}
          </Text>
          <View style={styles.ratingContainer}>
            <Text variant="bodyMedium">Nota:</Text>
            <View style={styles.stars}>{renderStars(newRating, true)}</View>
          </View>
          <View style={styles.commentSection}>
            <View style={styles.commentHeader}>
              <Text variant="bodyMedium">Comentário:</Text>
              <IconButton
                icon={() => <Edit size={20} color="#6200ee" />}
                size={20}
                onPress={() => setShowCommentInput(!showCommentInput)}
              />
            </View>
            {showCommentInput && (
              <TextInput
                label="Comentário (opcional)"
                value={newComment}
                onChangeText={setNewComment}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.commentInput}
              />
            )}
            {!showCommentInput && newComment && (
              <Text variant="bodyMedium" style={styles.commentPreview}>
                "{newComment}"
              </Text>
            )}
          </View>
          <Button
            mode="contained"
            onPress={submitEvaluation}
            loading={submitting}
            disabled={submitting || newRating === 0}
            style={styles.submitButton}
          >
            {userEvaluation ? "Atualizar Avaliação" : "Enviar Avaliação"}
          </Button>
        </Card.Content>
      </Card>

      {/* Seção de Avaliações de Outros Usuários */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Avaliações da Comunidade
          </Text>
          {evaluations.length === 0 ? (
            <Text variant="bodyMedium" style={styles.noEvaluations}>
              Ainda não há avaliações para este jogo.
            </Text>
          ) : (
            evaluations.map((evaluation) => (
              <View key={evaluation.id} style={styles.evaluationItem}>
                <View style={styles.evaluationHeader}>
                  <Avatar.Text size={32} label={evaluation.profiles.first_name?.charAt(0) || "U"} />
                  <View style={styles.evaluationUserInfo}>
                    <Text variant="titleSmall">
                      {evaluation.profiles.first_name} {evaluation.profiles.last_name}
                    </Text>
                    <View style={styles.evaluationRating}>{renderStars(evaluation.rating)}</View>
                  </View>
                  <Text variant="bodySmall" style={styles.evaluationDate}>
                    {new Date(evaluation.created_at).toLocaleDateString("pt-BR")}
                  </Text>
                  {isAdmin && (
                    <Button mode="text" textColor="#d32f2f" compact onPress={() => deleteEvaluation(evaluation.id)}>
                      Deletar
                    </Button>
                  )}
                </View>
                {evaluation.comment && (
                  <Text variant="bodyMedium" style={styles.evaluationComment}>
                    {evaluation.comment}
                  </Text>
                )}
                <Divider style={styles.evaluationDivider} />
              </View>
            ))
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  gameContent: {
    alignItems: "center",
  },
  gameTitle: {
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  gameImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  gameInfoContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  gameStats: {
    flexDirection: "row",
    marginBottom: 16,
  },
  chip: {
    marginHorizontal: 4,
  },
  description: {
    lineHeight: 20,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  userActions: {
    width: "100%",
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  actionsTitle: {
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
    gap: 8,
  },
  actionButton: {
    minWidth: 100,
    borderColor: "#6200ee",
  },
  selectedButton: {
    backgroundColor: "#6200ee",
  },
  buttonLabel: {
    color: "#6200ee",
  },
  selectedButtonLabel: {
    color: "white",
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  stars: {
    flexDirection: "row",
    marginLeft: 12,
  },
  commentSection: {
    marginBottom: 16,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  commentInput: {
    marginTop: 8,
  },
  commentPreview: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    fontStyle: "italic",
  },
  submitButton: {
    alignSelf: "flex-start",
  },
  noEvaluations: {
    textAlign: "center",
    opacity: 0.7,
    fontStyle: "italic",
  },
  evaluationItem: {
    marginBottom: 16,
  },
  evaluationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  evaluationUserInfo: {
    flex: 1,
    marginLeft: 12,
  },
  evaluationRating: {
    flexDirection: "row",
    marginTop: 4,
  },
  evaluationDate: {
    opacity: 0.7,
  },
  evaluationComment: {
    marginLeft: 44,
    marginBottom: 8,
  },
  evaluationDivider: {
    marginTop: 8,
  },
})

