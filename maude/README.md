# Maude Encoding of Smart Home Applications for Safe Reconfiguration

This directory contains Maude code developed as part of the work on safe reconfiguration of IoT Applications.

Description of some of the files in the directory - 

* `basic-defs.maude` contains definitions of models for rule-based IoT applications
* `execute.maude` main file which lists the properties (e.g., seamless reconfiguration) to be checked on applications
* `prop.maude` contains definitions of the properties 
* `semantics.maude` defines the semantics of an IoT application
* `simulation.maude` executes an application (objects and compo) by simulation
* `verif.maude` seamless reconfiguration verification setup
* `examples.maude` sample IoT application to check for the safe reconfiguration 

## Execution
`maude-Yices2.darwin64 execute.maude` returns a boolean result indicating whether the reconfiguration is safe

## Maude
Details about Maude and its installation can be found on the Maude Website: [http://maude.cs.illinois.edu/w/index.php/The_Maude_System](http://maude.cs.illinois.edu/w/index.php/The_Maude_System)
