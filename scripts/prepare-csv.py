#!/usr/bin/env python

import os
import csv
import glob

dirbase = '../data/2010/'
dirpath = os.path.realpath(os.path.join(os.path.dirname(__file__), dirbase))
dirraw  = os.path.join(dirpath, 'raw')
dirproc = os.path.join(dirpath, 'processed')


def strip_first_row(filename):
    with open(os.path.join(dirraw, filename), 'rb') as fin:
        csv_in = csv.reader(fin)
        with open(dirproc + filename, 'wb') as fout:
            csv_out = csv.writer(fout)
            # Skip the first row
            csv_in.next()
            csv_out.writerows(csv_in)


### House Candidates & House TCP - strip the first row which is non-CSV data

strip_first_row('HouseCandidatesDownload-15508.csv')
strip_first_row('HouseTcpByCandidateByPollingPlaceDownload-15508.csv')

### House First Prefs - strip the first row(s) of each file and combine together

prefix = 'HouseStateFirstPrefsByPollingPlaceDownload-15508-'
with open(os.path.join(dirproc, prefix + 'all.csv'), 'wb') as fout:
    csv_out = csv.writer(fout)
    first = True
    for filename in glob.glob(os.path.join(dirraw, prefix + '*.csv')):
        with open(filename, 'rb') as fin:
            csv_in = csv.reader(fin)
            # Skip the first row, which contains invalid data
            csv_in.next()
            if not first:
                # For all files after the first one, skip the header row
                csv_in.next()
            first = False
            csv_out.writerows(csv_in)
