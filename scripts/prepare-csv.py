#!/usr/bin/env python

import csv
import glob

dirbase = '../data/2010/'
dirraw  = dirbase + 'raw/'
dirproc = dirbase + 'processed/'


def strip_first_row(filename):
    with open(dirraw + filename, 'rb') as fin:
        csv_in = csv.reader(fin)
        with open(dirproc + filename, 'wb') as fout:
            csv_out = csv.writer(fout)
            # Skip the first row
            csv_in.next()
            csv_out.writerows(csv_in)


### House Candidates & House TCP - strip the first row which is non-CSV data

strip_first_row('HouseCandidatesDownload-15508.csv')
strip_first_row('HouseTcpByCandidateByPollingPlaceDownload-15508.csv')

### House First Prefs - strip the first row of each file and combine together

prefix = 'HouseStateFirstPrefsByPollingPlaceDownload-15508-'
with open(dirproc + prefix + 'all.csv', 'wb') as fout:
    csv_out = csv.writer(fout)
    for filename in glob.glob(dirraw + prefix + '*.csv'):
        with open(filename, 'rb') as fin:
            csv_in = csv.reader(fin)
            csv_in.next()
            csv_out.writerows(csv_in)
