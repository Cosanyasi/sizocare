import { MedicationEventRecordedEvent, DomainEventEnvelope } from '@sizocare/shared-types';

export type MedicationEventRecordedEventEnvelope =
  DomainEventEnvelope<MedicationEventRecordedEvent>;
