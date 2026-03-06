import { describe, expect, it } from "vitest";
import { buildSystemPrompt, ACT_COMPANION_VERSION, ACT_FRAMEWORK } from "./elevation-act-prompt";

// ─── Tests del sistema de prompt ACT ─────────────────────────────────────────
describe("elevation-act-prompt – buildSystemPrompt", () => {
  it("genera un prompt con el nombre del usuario cuando se proporciona", () => {
    const prompt = buildSystemPrompt({ name: "Alejo", moodBefore: null, sessionCount: 0, recentThemes: [] });
    expect(prompt).toContain("Alejo");
  });

  it("usa 'tú' cuando no se proporciona nombre", () => {
    const prompt = buildSystemPrompt({ name: null, moodBefore: null, sessionCount: 0, recentThemes: [] });
    expect(prompt).toContain("tú");
  });

  it("incluye el mensaje de primera sesión cuando sessionCount es 0", () => {
    const prompt = buildSystemPrompt({ name: "María", moodBefore: null, sessionCount: 0, recentThemes: [] });
    expect(prompt).toContain("primera vez");
  });

  it("incluye el conteo de sesiones previas cuando sessionCount > 0", () => {
    const prompt = buildSystemPrompt({ name: "Carlos", moodBefore: null, sessionCount: 5, recentThemes: [] });
    expect(prompt).toContain("5");
    expect(prompt).toContain("sesiones");
  });

  it("incluye los temas recientes cuando se proporcionan", () => {
    const prompt = buildSystemPrompt({
      name: "Ana",
      moodBefore: null,
      sessionCount: 3,
      recentThemes: ["ansiedad", "trabajo", "gratitud"],
    });
    expect(prompt).toContain("ansiedad");
    expect(prompt).toContain("trabajo");
    expect(prompt).toContain("gratitud");
  });

  it("incluye los 6 procesos del Hexaflex ACT", () => {
    const prompt = buildSystemPrompt({ name: null, moodBefore: null, sessionCount: 0, recentThemes: [] });
    expect(prompt).toContain("Aceptación");
    expect(prompt).toContain("Defusión");
    expect(prompt).toContain("momento presente");
    expect(prompt).toContain("Yo como contexto");
    expect(prompt).toContain("Valores");
    expect(prompt).toContain("Acción comprometida");
  });

  it("incluye el protocolo de crisis con recursos de ayuda", () => {
    const prompt = buildSystemPrompt({ name: null, moodBefore: null, sessionCount: 0, recentThemes: [] });
    expect(prompt).toContain("crisis");
    expect(prompt).toContain("106");         // Colombia
    expect(prompt).toContain("SAPTEL");      // México
    expect(prompt).toContain("135");         // Argentina
    expect(prompt).toContain("findahelpline");
  });

  it("incluye los límites éticos explícitos", () => {
    const prompt = buildSystemPrompt({ name: null, moodBefore: null, sessionCount: 0, recentThemes: [] });
    expect(prompt).toContain("diagnóstico");
    expect(prompt).toContain("terapia");
    expect(prompt).toContain("medicamento");
  });

  it("incluye instrucciones de formato (sin markdown en el chat)", () => {
    const prompt = buildSystemPrompt({ name: null, moodBefore: null, sessionCount: 0, recentThemes: [] });
    expect(prompt).toContain("negritas");
    expect(prompt).toContain("párrafos");
  });

  it("genera un prompt de longitud razonable (> 2000 caracteres)", () => {
    const prompt = buildSystemPrompt({ name: "Test", moodBefore: 3, sessionCount: 2, recentThemes: ["familia"] });
    expect(prompt.length).toBeGreaterThan(2000);
  });

  it("no expone información sensible del usuario en el prompt", () => {
    const prompt = buildSystemPrompt({
      name: "Juan",
      moodBefore: 2,
      sessionCount: 10,
      recentThemes: ["ansiedad"],
    });
    // El prompt no debe contener emails, teléfonos ni IDs de usuario
    expect(prompt).not.toMatch(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    expect(prompt).not.toMatch(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/);
  });
});

// ─── Tests de metadatos del módulo ───────────────────────────────────────────
describe("elevation-act-prompt – metadata", () => {
  it("exporta la versión del sistema de prompt", () => {
    expect(ACT_COMPANION_VERSION).toBe("1.0.0");
  });

  it("exporta la referencia al marco ACT", () => {
    expect(ACT_FRAMEWORK).toContain("Hayes");
    expect(ACT_FRAMEWORK).toContain("1999");
  });
});
