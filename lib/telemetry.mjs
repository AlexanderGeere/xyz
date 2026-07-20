import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import {
  ConsoleSpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';

const provider = new WebTracerProvider({
  spanProcessors: [new SimpleSpanProcessor(new ConsoleSpanExporter())],
});

provider.register({
  // Changing default contextManager to use ZoneContextManager - supports asynchronous operations - optional
  contextManager: new ZoneContextManager(),
});

//Registering instrumentations
// registerInstrumentations({
//   instrumentations: [new DocumentLoadInstrumentation()],
// });
registerInstrumentations({
  instrumentations: [new DocumentLoadInstrumentation()],
});

const tracer = provider.getTracer('client-plugin-loader');
if (window.PerformanceObserver) {
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      // Only trace JavaScript files

      if (
        entry.entryType === 'resource' &&
        entry.name.endsWith('.js') &&
        entry.name.includes('PLUGIN')
      ) {
        // Start a manual span matching the script loading timestamps
        const span = tracer.startSpan(
          `load-file: ${entry.name.split('/').pop()}`,
          {
            startTime: performance.timeOrigin + entry.startTime,
          },
        );

        // Add useful metadata about the file payload
        span.setAttributes({
          'http.url': entry.name,
          'resource.size.encoded': entry.encodedBodySize,
          'resource.size.decoded': entry.decodedBodySize,
          'resource.protocol': entry.nextHopProtocol,
          'network.duration_ms': entry.duration,
        });

        // End the span with the correct resolution timestamp
        span.end(performance.timeOrigin + entry.responseEnd);
      }
    });
  });

  // Start observing network resources with 'buffered: true'
  // This ensures scripts loaded right before this code initializes are still caught
  observer.observe({ type: 'resource', buffered: true });
}
