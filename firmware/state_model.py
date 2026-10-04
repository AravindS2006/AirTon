"""Conceptual state model only: no actuator or acquisition interfaces."""

from dataclasses import dataclass
from enum import Enum


class State(str, Enum):
    BOOT = "boot"
    ALIGN = "align"
    READY = "ready"
    CAPTURE = "capture-simulated"
    FAULT = "fault"


@dataclass
class Preconditions:
    self_test_ok: bool = False
    aligned: bool = False
    calibration_valid: bool = False
    independent_interlock_ok: bool = False

    def ready(self):
        return all(x is True for x in (self.self_test_ok, self.aligned,
                                      self.calibration_valid, self.independent_interlock_ok))


class StateModel:
    def __init__(self):
        self.state = State.BOOT

    def assess(self, conditions):
        if self.state == State.FAULT:
            return self.state  # Fault is latched; a new boot/model is needed.
        if conditions.self_test_ok is not True:
            self.state = State.FAULT
        elif conditions.ready():
            self.state = State.READY
        else:
            self.state = State.ALIGN
        return self.state

    def request_capture(self, conditions):
        if self.state != State.READY or not conditions.ready():
            self.state = State.FAULT
            raise RuntimeError("Capture simulation blocked by preconditions")
        self.state = State.CAPTURE
        return {"simulated": True, "hardware_enabled": False}

    def fault(self):
        self.state = State.FAULT
