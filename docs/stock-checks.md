# Stock check scheduling

`scheduleStockChecks` runs a periodic inventory check using a single long-lived interval.
Resource usage stays flat, but if the check takes longer than the interval, executions may overlap,
leading to backpressure and increased load. For heavy shops consider longer intervals or a queue-based scheduler to
serialize work and avoid piling tasks.
