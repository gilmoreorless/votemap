#!/usr/bin/env python

import os
import csv
import couchdb

dirbase = '../data/2010/processed'
dirpath = os.path.realpath(os.path.join(os.path.dirname(__file__), dirbase))

couch = couchdb.Server()
db = couch['votemap-dev']
batch_size = 5000


def convert_file(filename, datatype, id_field, log_fields):
    print '\n--- Datatype: %s ---\n' % datatype
    with open(os.path.join(dirpath, filename), 'rb') as fin:
        data = csv.DictReader(fin)
        docs = []
        for row in data:
            row['datatype'] = datatype
            row['_id'] = datatype + '-' + row[id_field]
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
    convert_file(filename, 'candidate', 'CandidateID', ['GivenNm', 'Surname'])


def run_places():
    filename = 'GeneralPollingPlacesDownload-15508.csv'
    convert_file(filename, 'place', 'PollingPlaceID', ['State', 'DivisionNm', 'PollingPlaceNm'])


def run_votes_by_place():
    datatype = 'votes-by-place'
    print '\n--- Datatype: %s ---\n' % datatype
    filename_fp = 'HouseStateFirstPrefsByPollingPlaceDownload-15508-all.csv'
    filename_tcp = 'HouseTcpByCandidateByPollingPlaceDownload-15508.csv'
    tcp_dict = dict()
    docs = []
    saved = 0

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

run_candidates()
run_places()
run_votes_by_place()
