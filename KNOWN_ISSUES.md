## Known Issues

1. Trims new line characters from the start of yaml style multiline blocks
Test Cases: "parses multi-line block for params when the first few lines are empty", "parses multi-line block for params when the first few lines are empty (multi-action)"

# Example Input
action: BLOCK
params:
  x:


123
456
789
action: BLOCK
params:
  x: 5

# Example Output
[
{
    "action": "BLOCK",
    "params": {
    "x": "
123
456
789",
    },
},
]
