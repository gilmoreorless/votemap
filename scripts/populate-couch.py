#!/usr/bin/env python

import os
import csv
import glob
import json
import argparse
import couchdb

default_year = '2010'

parser = argparse.ArgumentParser(description='Take processed CSV files and add the data to CouchDB')
parser.add_argument('-y', '--year', default=default_year)
parser.add_argument('-c', '--config', default='dev')
args = parser.parse_args()

dirbase = '../data'
dirpath = os.path.realpath(os.path.join(os.path.dirname(__file__), dirbase, args.year, 'processed'))
designpath = os.path.realpath(os.path.join(os.path.dirname(__file__), dirbase, 'couchdesigns'))
configpath = os.path.realpath(os.path.join(os.path.dirname(__file__), '../config'))

with open(os.path.join(configpath, args.config + '.json')) as f:
    raw_json = f.read()
    config = json.loads(raw_json)

couch_url = config['couch_url']
couch_db = config['couch_db']
couch = couchdb.Server(couch_url)
db = couch[couch_db]
batch_size = 10000


def convert_file(filename, datatype, id_field, convert_fields, log_fields):
    print '\n--- Datatype: %s ---\n' % datatype
    with open(os.path.join(dirpath, filename), 'rb') as fin:
        data = csv.DictReader(fin)
        docs = []
        for row in data:
            row['datatype'] = datatype
            row['_id'] = datatype + '-' + row[id_field]
            for f in convert_fields:
                if f in row:
                    t = convert_fields[f]
                    if t == 'int' and len(row[f]) > 0:
                        row[f] = int(row[f])
                    elif t == 'float' and len(row[f]) > 0:
                        row[f] = float(row[f])

            # for lf in log_fields:
            #     print row[lf],
            # print
            docs.append(row)
            if (len(docs) == batch_size):  # Batch updates
                print '...Saving %d rows...' % batch_size
                db.update(docs)
                docs = []
        print '...Saving %d rows...' % len(docs)
        db.update(docs)


def run_candidates():
    filename = 'HouseCandidatesDownload-15508.csv'
    convert_file(filename, 'candidate', 'CandidateID',
                 {'DivisionID': 'int', 'CandidateID': 'int'},
                 ['GivenNm', 'Surname'])


def run_places():
    filename = 'GeneralPollingPlacesDownload-15508.csv'
    convert_file(filename, 'place', 'PollingPlaceID',
                 {
                     'DivisionID': 'int',
                     'PollingPlaceID': 'int',
                     'PollingPlaceTypeID': 'int',
                     'PremisesPostCode': 'int',
                     'Latitude': 'float',
                     'Longitude': 'float',
                 },
                 ['State', 'DivisionNm', 'PollingPlaceNm'])


def run_votes_by_place():
    datatype = 'votes-by-place'
    print '\n--- Datatype: %s ---\n' % datatype
    filename_fp = 'HouseStateFirstPrefsByPollingPlaceDownload-15508-all.csv'
    filename_tcp = 'HouseTcpByCandidateByPollingPlaceDownload-15508.csv'
    tcp_dict = dict()
    docs = []
    saved = 0
    convert_fields = {
        'DivisionID': 'int',
        'PollingPlaceID': 'int',
        'CandidateID': 'int',
        'BallotPosition': 'int',
        'OrdinaryVotesFirstPrefs': 'int',
        'OrdinaryVotesTCP': 'int',
        'SwingFirstPrefs': 'float',
        'SwingTCP': 'float',
    }

    with open(os.path.join(dirpath, filename_tcp), 'rb') as fin_tcp:
        data_tcp = csv.DictReader(fin_tcp)
        for row in data_tcp:
            tcp_dict[row['PollingPlaceID'] + '-' + row['CandidateID']] = row

    with open(os.path.join(dirpath, filename_fp), 'rb') as fin_fp:
        data_fp = csv.DictReader(fin_fp)
        for row in data_fp:
            key = row['PollingPlaceID'] + '-' + row['CandidateID']
            row['datatype'] = datatype
            row['_id'] = row['datatype'] + '-' + key
            row['OrdinaryVotesFirstPrefs'] = row['OrdinaryVotes']
            row['SwingFirstPrefs'] = row['Swing']
            del row['OrdinaryVotes']
            del row['Swing']
            if key in tcp_dict:
                tcp_row = tcp_dict[key]
                row['OrdinaryVotesTCP'] = tcp_row['OrdinaryVotes']
                row['SwingTCP'] = tcp_row['Swing']

            for f in convert_fields:
                if f in row:
                    t = convert_fields[f]
                    if t == 'int' and len(row[f]) > 0:
                        row[f] = int(row[f])
                    elif t == 'float' and len(row[f]) > 0:
                        row[f] = float(row[f])

            docs.append(row)
            l = len(docs)
            if (l == batch_size):  # Batch updates
                saved += l
                print '...Saving %d rows (%d total)...' % (l, saved)
                db.update(docs)
                docs = []
        l = len(docs)
        saved += l
        print '...Saving %d rows (%d total)...' % (l, saved)
        db.update(docs)


def run_design_docs():
    cmd_tpl = 'curl -X PUT {0}/{1}/_design/{2} --data-binary @{3}'
    for filename in glob.glob(os.path.join(designpath, '*.json')):
        name = os.path.splitext(os.path.basename(filename))[0]
        # Yup, cheating, but I CBF going through the palaver of doing it properly via Python wrappers
        cmd = cmd_tpl.format(couch_url, couch_db, name, filename)
        os.system(cmd)


run_candidates()
run_places()
run_votes_by_place()
run_design_docs()
