import { NodeSDK } from "@opentelemetry/sdk-node";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-base";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";

// Configure the SDK for Node.js
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: "darvaya-ai-chatbot",
    [SemanticResourceAttributes.SERVICE_VERSION]: "1.0.0",
    "deployment.environment": process.env.NODE_ENV || "development",
  }),
  traceExporter:
    process.env.NODE_ENV === "development"
      ? new ConsoleSpanExporter()
      : new OTLPTraceExporter({
          // Configure your OTLP endpoint here if needed
          // url: 'http://your-otlp-endpoint:4318/v1/traces',
        }),
  instrumentations: [
    getNodeAutoInstrumentations({
      // Disable specific instrumentations if needed
      "@opentelemetry/instrumentation-fs": {
        enabled: false,
      },
      // Add any other instrumentation configurations
    }),
  ],
});

// Gracefully shut down the SDK on process exit
process.on("SIGTERM", async () => {
  try {
    await sdk.shutdown();
    console.log("Tracing terminated");
  } catch (error: unknown) {
    console.error("Error terminating tracing", error);
  } finally {
    process.exit(0);
  }
});

export async function register() {
  // Initialize the SDK and start the tracer
  try {
    await sdk.start();
    console.log("Tracing initialized");
  } catch (error: unknown) {
    console.error("Error initializing tracing", error);
  }
}
