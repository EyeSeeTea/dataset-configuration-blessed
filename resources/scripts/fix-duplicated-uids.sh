#!/bin/bash
#
# Depedencies: curl, jq
set -e -u -o pipefail

debug() {
    echo "$@" >&2
}

main() { local indicator_uids=$1 dhisurl=$2
    local indicator_id filter data_entry_form_ids records_found

    for indicator_uid in $indicator_uids; do
        debug "Process indicator: $indicator_uid"

        records_found=$(
            curl -f -sS -X GET "$dhisurl/api/indicators?filter=id:eq:$indicator_uid" |
                jq '.pager | .total'
        )

        if test $records_found -ne 1; then
            debug "  Indicator not found: $indicator_uid"
            continue
        fi

        new_indicator_uid=$(curl -f -sS "$dhisurl/api/system/id.json" | jq -r '.codes[0]')
        debug "  Replace indicator UID: $indicator_uid -> $new_indicator_uid"

        filter="htmlCode:like:indicator${indicator_uid}"
        data_entry_form_ids=$(
            curl -f -sS -X GET "$dhisurl/api/dataEntryForms.json?paging=false&filter=$filter" |
                jq -r '.dataEntryForms[] | .id'
        )

        for data_entry_form_id in $data_entry_form_ids; do
            debug "  Update custom form: $data_entry_form_id"
                curl -f -sS -X GET "$dhisurl/api/dataEntryForms/$data_entry_form_id.json?fields=htmlCode" |
                    sed "
                        # Update custom form, example: <input id="indicatorXMRmqF9reP5" indicatorid="XMRmqF9reP5" ...>
                        s/indicator$indicator_uid/indicator$new_indicator_uid/g;
                        s/indicatorid=\\\\\"$indicator_uid\\\\\"/indicatorid=\\\\\"$new_indicator_uid\\\\\"/g;
                    " > htmlcode.json
                curl -f -sS -X PATCH "$dhisurl/api/dataEntryForms/${data_entry_form_id}.json" \
                    -H "Content-Type: application/json" -d @htmlcode.json
        done

        debug "  Update indicator UID: $new_indicator_uid"
        curl -f -sS -X PATCH "$dhisurl/api/indicators/$indicator_uid.json" \
            -H "Content-Type: application/json" \
            -d "{\"id\": \"$new_indicator_uid\"}"
    done
}

# curl -sS -u admin:district 'http://localhost:9026/api/dataElements?paging=false' | jq -r '.dataElements[] | .id' | sort > dataElements.json
# curl -sS -u admin:district 'http://localhost:9026/api/indicators?paging=false' | jq -r '.indicators[] | .id' | sort > indicators.json
# comm -12 dataElements.json indicators.json | xargs

indicator_uids="XMRmqF9reP5 UzT7DSkkbxH ZDONOAJJNBV wFrRdK9XyIM"

if test $# -ne 1; then
    debug "Usage: fix-duplicated-uids.sh http://admin:district@localhost:8080"
    exit 2
else
    main "$indicator_uids" "$@"
fi
