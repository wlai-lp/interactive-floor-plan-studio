# Canonical Fixture Correction

During release-gate preparation for issue #17, the checked-in golden YAML fixture was found to lag the implemented exporter contract: the overlay style omitted `pointer-events: none` and explicit centering transforms even though the production exporter already emitted them.

This branch corrects only the fixture/documentation and adds a regression test. No exporter runtime behavior is changed.
