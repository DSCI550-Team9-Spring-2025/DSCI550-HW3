
"""
Notes: I used the assistance of  MS Copilot to help fine tune this  code since it is allowed.
I have read and understood the code provided by the AI tools, and is responsible for the final implementation of the code.
I have also made sure to follow the academic integrity guidelines of USC.
"""
import pandas as pd
import json
import os
import math

def process_large_file(input_file, output_folder, num_files):
    # Read the input file
    data = pd.read_csv(input_file, sep='\t')  # Specify tab as the separator for TSV files
    rows = len(data)
    
    # Calculate subset size dynamically
    subset_size = math.ceil(rows / num_files)
    
    # Ensure the output folder exists
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
    
    # Split the data into subsets
    for i in range(0, rows, subset_size):
        subset = data.iloc[i:i+subset_size]
        subset_dict = subset.to_dict(orient='records')
        
        # Create output JSON file
        output_file = os.path.join(output_folder, f'subset_{i//subset_size + 1}.json')
        with open(output_file, 'w') as f:
            json.dump(subset_dict, f, indent=4)
        print(f'Subset {i//subset_size + 1} saved to {output_file}')
        
# Example usage
input_file = 'v2_final.tsv'  # Replace with your TSV input file path
output_folder = 'data/jsons/'  # Replace with your desired output folder path
num_files = 50  # Number of subsets/files to create

process_large_file(input_file, output_folder, num_files)
