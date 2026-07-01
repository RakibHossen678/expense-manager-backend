/**
 * Shared schema plugin applied to every model so all collections behave
 * consistently: timestamps, and a toJSON transform that strips Mongoose
 * internals (__v) and exposes a clean `id` field instead of `_id`.
 *
 * Usage in a model file:
 *   schema.plugin(baseModelPlugin);
 */
export const baseModelPlugin = (schema) => {
  schema.set('timestamps', true);

  // Schema-level bufferCommands overrides both the global mongoose.set()
  // and connect() options, so it must be set here to actually take effect.
  // Also set a tight bufferTimeoutMS as a safety net in case buffering is
  // ever re-enabled by a future schema option.
  schema.set('bufferCommands', false);
  schema.set('bufferTimeoutMS', 2000);

  schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      return ret;
    },
  });
};
