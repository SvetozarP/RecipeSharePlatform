"""
Event bus implementation for inter-module communication.
Uses Django signals for event handling but provides a more structured interface.
"""

from typing import Any, Callable, Dict
from django.dispatch import Signal, receiver
from django.db.models.signals import post_save, post_delete

class EventBus:
    """
    Central event bus for publishing and subscribing to application events.
    Provides a higher-level abstraction over Django's signal system.
    """
    
    # Predefined signals for common events
    MODEL_CREATED = 'model.created'
    MODEL_UPDATED = 'model.updated'
    MODEL_DELETED = 'model.deleted'

    _signals: Dict[str, Signal] = {}

    @classmethod
    def get_signal(cls, event_name: str) -> Signal:
        """Get or create a signal for the given event name."""
        if event_name not in cls._signals:
            cls._signals[event_name] = Signal()
        return cls._signals[event_name]

    @classmethod
    def publish(cls, event_name: str, sender: Any = None, **kwargs) -> None:
        """
        Publish an event to all subscribers.
        
        Args:
            event_name: The name of the event
            sender: The object publishing the event
            **kwargs: Additional data to pass to event handlers
        """
        signal = cls.get_signal(event_name)
        signal.send(sender=sender, **kwargs)

    @classmethod
    def subscribe(cls, event_name: str, handler: Callable) -> Callable:
        """
        Subscribe to an event.
        
        Args:
            event_name: The name of the event to subscribe to
            handler: The function to call when the event occurs
            
        Returns:
            The decorated handler function
        """
        signal = cls.get_signal(event_name)
        return receiver(signal)(handler)

    @classmethod
    def unsubscribe(cls, event_name: str, handler: Callable) -> None:
        """
        Unsubscribe a handler from an event.
        
        Args:
            event_name: The name of the event
            handler: The handler function to unsubscribe
        """
        signal = cls.get_signal(event_name)
        signal.disconnect(handler)

    @classmethod
    def model_created(cls, sender, instance, created, **kwargs):
        """Handle post_save signal when a model is created."""
        if created:
            cls.publish(
                cls.MODEL_CREATED,
                sender=sender,
                instance=instance,
                **kwargs
            )

    @classmethod
    def model_updated(cls, sender, instance, created, **kwargs):
        """Handle post_save signal when a model is updated."""
        if not created:
            cls.publish(
                cls.MODEL_UPDATED,
                sender=sender,
                instance=instance,
                **kwargs
            )

    @classmethod
    def model_deleted(cls, sender, instance, **kwargs):
        """Handle post_delete signal when a model is deleted."""
        cls.publish(
            cls.MODEL_DELETED,
            sender=sender,
            instance=instance,
            **kwargs
        )

# Connect model signals to event bus
post_save.connect(EventBus.model_created)
post_save.connect(EventBus.model_updated)
post_delete.connect(EventBus.model_deleted) 