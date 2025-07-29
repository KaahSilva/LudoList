"use client"

import { useState } from "react"
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from "react-native"
import { TextInput, Button, Card, Text, HelperText, IconButton } from "react-native-paper"
import { supabase } from "../../../lib/supabase"
import { useRouter } from "expo-router"
import { z } from "zod"

const gameSchema = z
  .object({
    name: z.string().min(1, "Nome é obrigatório").transform((val) => val.trim()),
    description: z.string().transform((val) => val.trim()),
    min_players: z
      .string()
      .min(1, "Número mínimo de jogadores é obrigatório")
      .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Deve ser um número válido maior que 0"),
    max_players: z
      .string()
      .min(1, "Número máximo de jogadores é obrigatório")
      .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Deve ser um número válido maior que 0"),
    playing_time: z
      .string()
      .min(1, "Tempo de jogo é obrigatório")
      .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Deve ser um número válido maior que 0"),
    thumbnail_url: z.string().transform((val) => val.trim()),
  })
  .refine((data) => Number(data.min_players) <= Number(data.max_players), {
    message: "Máximo deve ser maior ou igual ao mínimo",
    path: ["max_players"],
  })

type GameFormData = z.infer<typeof gameSchema>

export default function AddGameScreen() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    min_players: "",
    max_players: "",
    playing_time: "",
    thumbnail_url: "",
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()

  const validateForm = () => {
    const validation = gameSchema.safeParse(formData)
    if (!validation.success) {
      const newErrors: Record<string, string> = {}
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as string
        newErrors[field] = issue.message
      })
      setErrors(newErrors)
      return false
    }
    setErrors({})
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    setLoading(true)
    try {
      const validatedData = gameSchema.parse(formData)
      const { error } = await supabase.from("games").insert({
        name: validatedData.name,
        description: validatedData.description || null,
        min_players: Number(validatedData.min_players),
        max_players: Number(validatedData.max_players),
        playing_time: Number(validatedData.playing_time),
        thumbnail_url: validatedData.thumbnail_url || null,
      })
      if (error) {
        console.error("Erro ao adicionar jogo:", error)
        return
      }
      router.back()
    } catch (error) {
      console.error("Erro inesperado:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      {/* Header customizado com botão de voltar */}
      <View style={styles.customHeader}>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <Text variant="titleLarge" style={styles.customHeaderText}>Adicionar Jogo</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <TextInput
                  label="Nome do Jogo *"
                  value={formData.name}
                  onChangeText={(text) => updateField("name", text)}
                  mode="outlined"
                  error={!!errors.name}
                />
                <HelperText type="error" visible={!!errors.name}>{errors.name}</HelperText>
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  label="Descrição"
                  value={formData.description}
                  onChangeText={(text) => updateField("description", text)}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <TextInput
                    label="Min. Jogadores *"
                    value={formData.min_players}
                    onChangeText={(text) => updateField("min_players", text)}
                    mode="outlined"
                    keyboardType="numeric"
                    error={!!errors.min_players}
                  />
                  <HelperText type="error" visible={!!errors.min_players}>{errors.min_players}</HelperText>
                </View>

                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <TextInput
                    label="Max. Jogadores *"
                    value={formData.max_players}
                    onChangeText={(text) => updateField("max_players", text)}
                    mode="outlined"
                    keyboardType="numeric"
                    error={!!errors.max_players}
                  />
                  <HelperText type="error" visible={!!errors.max_players}>{errors.max_players}</HelperText>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  label="Tempo de Jogo (minutos) *"
                  value={formData.playing_time}
                  onChangeText={(text) => updateField("playing_time", text)}
                  mode="outlined"
                  keyboardType="numeric"
                  error={!!errors.playing_time}
                />
                <HelperText type="error" visible={!!errors.playing_time}>{errors.playing_time}</HelperText>
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  label="URL da Imagem"
                  value={formData.thumbnail_url}
                  onChangeText={(text) => updateField("thumbnail_url", text)}
                  mode="outlined"
                  keyboardType="url"
                />
              </View>

              <View style={styles.buttonContainer}>
                <Button mode="outlined" onPress={() => router.back()} style={styles.button}>Cancelar</Button>
                <Button mode="contained" onPress={handleSubmit} loading={loading} disabled={loading} style={styles.button}>
                  Adicionar Jogo
                </Button>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 20,
    paddingHorizontal: 8,
    paddingBottom: 12,
    backgroundColor: "#e7e3e9",
  },
  customHeaderText: {
    fontWeight: "bold",
    fontSize: 20,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    elevation: 2,
  },
  form: {
    gap: 8,
  },
  inputContainer: {
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    gap: 16,
  },
  halfWidth: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 16,
    marginTop: 24,
  },
  button: {
    flex: 1,
  },
})
