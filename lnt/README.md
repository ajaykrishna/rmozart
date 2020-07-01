# LNT Encoding of Smart Home Applications
This directory contains LNT files related to the encoding of typical smart home scenarios. 
An IoT application encoding consists of objects, rules and composition of rules. 
In addition to it, we model the environment to simulate the physical environment.

Following are the list of processes (files) used in the encoding - 
* Config.lnt - A configuration process (similar to a header file) that stores commonly used functions and types.
* Device.lnt (e.g., motiondevice.lnt, lightdevice.lnt) - Object process that encodes the behaviour of the object
* Rules.lnt - Encoding of ECA rules
* Env.lnt - Process to simulate the environment (partial)
* Composition.lnt - Executable MAIN process which encodes the composition of rules
* Prop.mcl - Encoding of the MCL properties that need to be verified
* Labels.ren - Renaming file used to rename the LTS (optional)
* Run.svl - SVL script file to automate the execution and verification of the scenario

Note: Some scenarios may contain a single file encoding all the processes instead of multiple LNT files

## Execution
* `svl run.svl` executes the scenario. The overall LTS is generated in `composition.bcg` and minimized version of it in `composition_ren_min.bcg`.
* A log file with results of the execution is generated will be available in `results.txt`

Note: SVL/LNT execution requires local installation of CADP with an appropriate licence. More details available [here](https://cadp.inria.fr/).  
